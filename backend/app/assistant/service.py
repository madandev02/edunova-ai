from sqlalchemy.orm import Session

from app.analytics.service import build_analytics
from app.services.recommendation_service import get_recommendations_for_user
from app.services.embedding_service import retrieve_relevant_chunks


def build_assistant_reply(db: Session, user_id: int, message: str, course_id: int | None = None) -> dict:
    """
    Build assistant reply using RAG (Retrieval-Augmented Generation).
    Retrieves relevant course content chunks and uses them to ground the response.
    """
    # Get user context
    analytics = build_analytics(db=db, user_id=user_id)
    recommendations = get_recommendations_for_user(db=db, user_id=user_id)

    weak_topics = [item['topic'] for item in analytics['weak_areas']]
    top_recommendation = recommendations[0] if recommendations else None
    success_rate = analytics.get('success_rate', 0.0)

    # Retrieve relevant chunks from embeddings (RAG)
    relevant_chunks = retrieve_relevant_chunks(
        db=db,
        query=message,
        course_id=course_id,
        limit=3,
    )

    # Build context from retrieved chunks
    sources = []
    chunk_context = ''
    if relevant_chunks:
        chunk_context = '\n\n'.join(
            [f'Source: {c.get("metadata", {}).get("lesson_title", "Unknown")}]\n{c.get("chunk", "")}'
             for c in relevant_chunks if c['similarity'] > 0.1]
        )
        sources = [
            {
                'lesson': c.get('metadata', {}).get('lesson_title', 'Unknown'),
                'relevance': round(c['similarity'], 2),
            }
            for c in relevant_chunks if c['similarity'] > 0.1
        ]

    lowered = message.lower()
    asks_for_mistake_help = any(token in lowered for token in ('mistake', 'wrong', 'error', 'why failed'))

    # Build intelligent reply using RAG context
    if chunk_context and (asks_for_mistake_help or any(s for s in weak_topics if s.lower() in lowered)):
        reply = (
            f'Based on the course material, here is the relevant content:\n\n{chunk_context}\n\n'
            'Use these key concepts to check your understanding. '
            'If you\'re still unsure after reviewing, try the quiz again and focus on accuracy.'
        )
    elif weak_topics and any(topic.lower() in lowered for topic in weak_topics):
        focus_topic = next(topic for topic in weak_topics if topic.lower() in lowered)
        reply = (
            f'You are currently weakest in {focus_topic}. '
            'Use this mentor loop: 1) review the lesson goal, 2) replay the first transcript section, '
            '3) answer the quiz in your own words, 4) compare your answer to the key concept terms. '
            'This sequence usually fixes repeated mistakes quickly.'
        )
        if chunk_context:
            reply += f'\n\nKey material on this topic:\n{chunk_context}'
    elif asks_for_mistake_help and top_recommendation:
        reply = (
            f'Based on your recent signals, your most important gap is around {top_recommendation["topic"]}. '
            'You are likely missing a core concept or mixing terms. '
            'Review the highlighted transcript notes, then do one short re-attempt focused on accuracy over speed. '
            f'Next review target: {top_recommendation["reason"]}'
        )
        if chunk_context:
            reply += f'\n\nRelevant material:\n{chunk_context}'
    elif weak_topics:
        reply = (
            f'Your current weak area is {weak_topics[0]}. '
            'Start there for 20 minutes, then move to one medium-priority lesson to reinforce transfer. '
            'If your next score improves by 10+ points, continue the same pattern tomorrow.'
        )
    elif top_recommendation:
        reply = (
            f'You are progressing well. Next best action: {top_recommendation["topic"]}. '
            f'Reason: {top_recommendation["reason"]} '
            'Tip: take one transcript note while watching to improve retention before the quiz.'
        )
    else:
        reply = (
            'You are on track. Continue with your current lesson sequence and submit one focused quiz attempt. '
            'That new signal will let me recommend a sharper next step.'
        )

    context_parts = []
    if weak_topics:
        context_parts.append(f'Weak areas: {", ".join(weak_topics[:3])}')
    if top_recommendation:
        context_parts.append(f'Top recommendation priority: {top_recommendation["priority"]}')
    context_parts.append(f'Current success rate: {round(float(success_rate), 1)}%')
    if sources:
        context_parts.append(f'Sources: {", ".join([s["lesson"] for s in sources])}')

    return {
        'reply': reply,
        'context': ' | '.join(context_parts) if context_parts else None,
        'sources': sources if sources else None,
    }
