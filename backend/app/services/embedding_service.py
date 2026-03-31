import json
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
import hashlib

from app.models.assistant_embedding import AssistantEmbedding
from app.models.course import Course


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    if not text or len(text) == 0:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap

    return chunks


def simple_embedding(text: str) -> list[float]:
    """
    Generate a simple deterministic embedding from text.
    In production, use OpenAI embeddings, Huggingface, or similar.
    This is a placeholder that hashes text into a fixed-size vector.
    """
    # For MVP: create a fake embedding from text hash
    hash_obj = hashlib.sha256(text.encode())
    hash_hex = hash_obj.hexdigest()

    # Convert hash to floats in range [-1, 1]
    embedding = []
    for i in range(0, 32, 2):
        hex_pair = hash_hex[i : i + 2]
        val = (int(hex_pair, 16) - 128) / 128.0
        embedding.append(val)

    return embedding


def embed_course_content(db: Session, course_id: int) -> int:
    """
    Generate and store embeddings for all lessons in a course.
    Returns count of embedding records created/updated.
    """
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail='Course not found')

    count = 0

    for module in course.modules:
        for lesson in module.lessons:
            # Skip if already embedded recently
            existing = db.scalar(
                select(AssistantEmbedding).where(
                    AssistantEmbedding.entity_type == 'lesson',
                    AssistantEmbedding.entity_id == lesson.id,
                )
            )
            if existing is not None:
                # Could add timestamp check here for reindexing
                continue

            # Chunk lesson content
            chunks = chunk_text(lesson.content, chunk_size=500, overlap=50)

            for chunk in chunks:
                embedding_vector = simple_embedding(chunk)

                metadata = {
                    'lesson_id': lesson.id,
                    'lesson_title': lesson.title,
                    'module_id': module.id,
                    'module_title': module.title,
                    'course_id': course_id,
                    'course_title': course.title,
                }

                record = AssistantEmbedding(
                    entity_type='lesson',
                    entity_id=lesson.id,
                    chunk_text=chunk,
                    metadata_json=json.dumps(metadata),
                    vector_json=json.dumps(embedding_vector),
                )
                db.add(record)
                count += 1

    db.commit()
    return count


def retrieve_relevant_chunks(
    db: Session,
    query: str,
    course_id: int | None = None,
    limit: int = 5,
) -> list[dict]:
    """
    Retrieve chunks relevant to a query using simple cosine similarity.
    In production, use vector database like Pinecone, Milvus, or Weaviate.
    """
    query_embedding = simple_embedding(query)

    all_embeddings = db.scalars(
        select(AssistantEmbedding).order_by(AssistantEmbedding.created_at.desc()).limit(1000)
    ).all()

    scored_chunks = []

    for record in all_embeddings:
        if course_id is not None:
            metadata = json.loads(record.metadata_json or '{}')
            if metadata.get('course_id') != course_id:
                continue

        try:
            stored_vec = json.loads(record.vector_json or '[]')
        except (json.JSONDecodeError, TypeError):
            continue

        # Compute cosine similarity
        dot_product = sum(q * s for q, s in zip(query_embedding, stored_vec))
        query_norm = sum(q * q for q in query_embedding) ** 0.5
        stored_norm = sum(s * s for s in stored_vec) ** 0.5

        if query_norm > 0 and stored_norm > 0:
            similarity = dot_product / (query_norm * stored_norm)
        else:
            similarity = 0.0

        scored_chunks.append(
            {
                'chunk': record.chunk_text,
                'similarity': similarity,
                'metadata': json.loads(record.metadata_json or '{}'),
            }
        )

    # Sort by similarity and return top results
    scored_chunks.sort(key=lambda x: x['similarity'], reverse=True)
    return scored_chunks[:limit]


def delete_course_embeddings(db: Session, course_id: int) -> int:
    """Delete embeddings for a course."""
    from sqlalchemy import delete

    result = db.execute(
        delete(AssistantEmbedding).where(
            AssistantEmbedding.vector_json.ilike(f'%"course_id": {course_id}%')
        )
    )
    db.commit()
    return result.rowcount or 0
