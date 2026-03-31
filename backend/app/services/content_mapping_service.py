from __future__ import annotations

from dataclasses import dataclass
import re


STOP_WORDS = {
    'and',
    'the',
    'with',
    'for',
    'from',
    'that',
    'this',
    'into',
    'your',
    'about',
    'using',
    'what',
    'when',
    'why',
    'how',
    'real',
}


@dataclass(frozen=True)
class CuratedVideo:
    keywords: tuple[str, ...]
    url: str
    duration_seconds: int
    title: str


CURATED_TOPIC_VIDEOS: tuple[CuratedVideo, ...] = (
    CuratedVideo(('recursion', 'base case'), 'https://www.youtube.com/embed/ngCos392W4w?rel=0', 640, 'Recursion fundamentals with base cases'),
    CuratedVideo(('backtracking', 'decision tree'), 'https://www.youtube.com/embed/DKCbsiDBN6c?rel=0', 760, 'Backtracking and recursive decision trees'),
    CuratedVideo(('big-o', 'complexity', 'asymptotic'), 'https://www.youtube.com/embed/v4cd1O4zkGw?rel=0', 560, 'Big-O complexity explained for engineers'),
    CuratedVideo(('optimization', 'profiling', 'performance'), 'https://www.youtube.com/embed/nXaxk27zwlk?rel=0', 600, 'Optimization trade-offs and profiling workflow'),
    CuratedVideo(('north star', 'metric', 'product metrics'), 'https://www.youtube.com/embed/6ExsR4jX4bU?rel=0', 520, 'North Star metrics for product teams'),
    CuratedVideo(('retention', 'cohort', 'funnel'), 'https://www.youtube.com/embed/9H8K6fDgqX8?rel=0', 590, 'Retention and cohort analysis in product analytics'),
    CuratedVideo(('react', 'state', 'component'), 'https://www.youtube.com/embed/35lXWvCuM8o?rel=0', 680, 'React state architecture and composition patterns'),
    CuratedVideo(('query', 'cache', 'react query'), 'https://www.youtube.com/embed/novnyCaa7To?rel=0', 720, 'React Query caching and query key design'),
    CuratedVideo(('fastapi', 'api', 'pydantic'), 'https://www.youtube.com/embed/7t2alSnE2-I?rel=0', 700, 'FastAPI API design with schema contracts'),
    CuratedVideo(('jwt', 'authentication', 'security'), 'https://www.youtube.com/embed/mbsmsi7l3r4?rel=0', 640, 'JWT authentication design and security basics'),
    CuratedVideo(('recommendation', 'recommender', 'ranking'), 'https://www.youtube.com/embed/n3RKsY2H-NE?rel=0', 760, 'Recommendation systems foundations'),
    CuratedVideo(('llm', 'assistant', 'prompt', 'guardrail'), 'https://www.youtube.com/embed/jkrNMKz9pWU?rel=0', 610, 'LLM assistant quality, context, and guardrails'),
    CuratedVideo(('sql', 'index', 'query plan', 'normalization'), 'https://www.youtube.com/embed/HXV3zeQKqGY?rel=0', 620, 'SQL indexing and query optimization essentials'),
    CuratedVideo(('devops', 'ci', 'cd', 'pipeline'), 'https://www.youtube.com/embed/scEDHsr3APg?rel=0', 660, 'CI/CD pipelines and release reliability'),
    CuratedVideo(('ux', 'interview', 'discovery', 'research'), 'https://www.youtube.com/embed/QwF9a56WFWA?rel=0', 560, 'UX research interviews and discovery loops'),
)


CATEGORY_FALLBACK_VIDEOS: dict[str, CuratedVideo] = {
    'computer science': CuratedVideo(('computer science',), 'https://www.youtube.com/embed/rfscVS0vtbw?rel=0', 780, 'Computer science foundations for practical engineering'),
    'data': CuratedVideo(('data',), 'https://www.youtube.com/embed/ua-CiDNNj30?rel=0', 760, 'Data analytics foundations for product decisions'),
    'frontend': CuratedVideo(('frontend',), 'https://www.youtube.com/embed/bMknfKXIFA8?rel=0', 700, 'Modern frontend architecture patterns'),
    'backend': CuratedVideo(('backend',), 'https://www.youtube.com/embed/0sOvCWFmrtA?rel=0', 700, 'Backend API architecture in practice'),
    'ai': CuratedVideo(('ai',), 'https://www.youtube.com/embed/aircAruvnKk?rel=0', 700, 'Practical AI concepts for product builders'),
    'devops': CuratedVideo(('devops',), 'https://www.youtube.com/embed/1hHMwLxN6EM?rel=0', 670, 'DevOps delivery and reliability essentials'),
    'mobile': CuratedVideo(('mobile',), 'https://www.youtube.com/embed/_r0VX-aU_T8?rel=0', 600, 'Mobile product and UX fundamentals'),
    'ux': CuratedVideo(('ux',), 'https://www.youtube.com/embed/Ovj4hFxko7c?rel=0', 560, 'UX discovery and research workflow'),
    'product': CuratedVideo(('product',), 'https://www.youtube.com/embed/502ILHjX9EE?rel=0', 620, 'Outcome-driven product strategy and execution'),
}


def _tokenize(value: str) -> set[str]:
    cleaned = re.sub(r'[^a-z0-9 ]+', ' ', value.lower())
    parts = {item.strip() for item in cleaned.split() if item.strip()}
    return {item for item in parts if len(item) > 2 and item not in STOP_WORDS}


def choose_curated_video(lesson_title: str, module_title: str, course_category: str) -> dict:
    searchable = f'{lesson_title} {module_title} {course_category}'.lower()
    tokens = _tokenize(searchable)

    winner: CuratedVideo | None = None
    winner_score = -1
    for item in CURATED_TOPIC_VIDEOS:
        score = sum(1 for keyword in item.keywords if keyword in searchable or keyword in tokens)
        if score > winner_score:
            winner = item
            winner_score = score

    if winner is None or winner_score <= 0:
        winner = CATEGORY_FALLBACK_VIDEOS.get(course_category.lower(), CATEGORY_FALLBACK_VIDEOS['computer science'])

    return {
        'video_url': winner.url,
        'video_duration_seconds': winner.duration_seconds,
        'video_title': winner.title,
    }


def extract_key_concepts(lesson_title: str, module_title: str, content: str, max_items: int = 4) -> list[str]:
    ranked: list[str] = []
    seen: set[str] = set()

    for phrase in [lesson_title, module_title]:
        words = [item for item in re.split(r'[:\-]', phrase) if item.strip()]
        for word in words:
            normalized = word.strip()
            if normalized.lower() in seen or len(normalized) < 4:
                continue
            seen.add(normalized.lower())
            ranked.append(normalized)

    sentences = [item.strip() for item in content.split('\n') if item.strip()]
    for line in sentences:
        candidate = line.split('.')[0].strip()
        candidate = re.sub(r'\s+', ' ', candidate)
        if len(candidate) < 16:
            continue
        lowered = candidate.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        ranked.append(candidate)
        if len(ranked) >= max_items:
            break

    return ranked[:max_items]


def build_lesson_goal(lesson_title: str, module_title: str) -> str:
    return (
        f'Build practical confidence in {lesson_title.lower()} so you can apply it inside the {module_title.lower()} workflow.'
    )


def build_course_prerequisites(difficulty: str, category: str) -> list[str]:
    normalized = difficulty.lower()
    category_hint = category.lower()

    if normalized == 'beginner':
        return [
            'Basic computer and internet literacy',
            f'Interest in {category_hint} concepts and practice-driven learning',
        ]

    if normalized == 'advanced':
        return [
            'Comfort with intermediate-level programming or analytics workflows',
            'Ability to debug problems independently and evaluate trade-offs',
            f'Prior exposure to {category_hint} terminology',
        ]

    return [
        'Basic familiarity with software concepts and API/data terminology',
        f'Hands-on interest in {category_hint} projects',
    ]


def build_course_learning_objectives(course_title: str, module_titles: list[str]) -> list[str]:
    objectives = [
        f'Explain the core mental models behind {course_title.lower()}.',
        'Apply concepts through lesson quizzes and guided progression checks.',
        'Use feedback signals from recommendations and analytics to improve weak areas.',
    ]

    for module_title in module_titles[:2]:
        objectives.append(f'Execute practical tasks from the module: {module_title}.')

    return objectives[:5]


def build_topic_aligned_quiz_question(lesson_title: str, key_concepts: list[str]) -> str:
    anchor = key_concepts[0] if key_concepts else lesson_title
    return f'Which statement best explains {anchor.lower()} in this lesson context?'


def is_generic_video(url: str | None) -> bool:
    if not url:
        return True
    lowered = url.lower()
    return 'gtv-videos-bucket' in lowered
