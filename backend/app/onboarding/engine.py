from app.models.course import Course


GOAL_TO_CATEGORY = {
    'Get a job': 'Computer Science',
    'Learn new skill': 'AI',
    'Improve current knowledge': 'Data',
    'Improve skills': 'Data',
    'Learn specific topic': 'AI',
}


DIFFICULTY_WEIGHTS = {
    'FOUNDATIONAL': 0.8,
    'INTERMEDIATE': 1.0,
    'ADVANCED': 1.3,
}


def _assessment_ratio(assessment_answers: list[object] | None) -> float | None:
    if not assessment_answers:
        return None

    total_weight = 0.0
    success_weight = 0.0

    for answer in assessment_answers:
        if isinstance(answer, bool):
            weight = DIFFICULTY_WEIGHTS['INTERMEDIATE']
            total_weight += weight
            if answer:
                success_weight += weight
            continue

        if isinstance(answer, dict):
            difficulty_value = answer.get('difficulty', 'INTERMEDIATE')
            correct_value = bool(answer.get('correct', False))
        else:
            difficulty_value = getattr(answer, 'difficulty', 'INTERMEDIATE')
            correct_value = bool(getattr(answer, 'correct', False))

        difficulty = str(difficulty_value).upper()
        weight = DIFFICULTY_WEIGHTS.get(difficulty, DIFFICULTY_WEIGHTS['INTERMEDIATE'])
        total_weight += weight
        if correct_value:
            success_weight += weight

    if total_weight <= 0:
        return None
    return success_weight / total_weight


def assessment_percentage(assessment_answers: list[object] | None) -> float | None:
    ratio = _assessment_ratio(assessment_answers)
    if ratio is None:
        return None
    return round(ratio * 100, 2)


def _difficulty_rank(value: str) -> int:
    return {
        'BEGINNER': 1,
        'INTERMEDIATE': 2,
        'ADVANCED': 3,
    }.get(value.upper(), 2)


def infer_level(experience_level: str, assessment_answers: list[object] | None) -> str:
    base = experience_level.upper()
    ratio = _assessment_ratio(assessment_answers)
    if ratio is None:
        return base

    if ratio < 0.35:
        return 'BEGINNER'

    assessment_rank = 1
    if ratio >= 0.75:
        assessment_rank = 3
    elif ratio >= 0.5:
        assessment_rank = 2

    base_rank = {
        'BEGINNER': 1,
        'INTERMEDIATE': 2,
        'ADVANCED': 3,
    }.get(base, 1)

    blended_rank = round((assessment_rank * 0.7) + (base_rank * 0.3))
    if blended_rank <= 1:
        return 'BEGINNER'
    if blended_rank == 2:
        return 'INTERMEDIATE'
    return 'ADVANCED'


def choose_first_course(
    courses: list[Course],
    goal: str,
    interests: list[str],
    learner_level: str,
) -> Course | None:
    if not courses:
        return None

    target_category = GOAL_TO_CATEGORY.get(goal)
    target_level_rank = _difficulty_rank(learner_level)
    normalized_interests = {item.strip().lower() for item in interests}

    def rank(course: Course) -> tuple[int, int]:
        category_match = 1 if target_category and course.category == target_category else 0
        interest_match = 1 if course.category.lower() in normalized_interests else 0
        distance = abs(_difficulty_rank(course.difficulty) - target_level_rank)
        return (category_match + interest_match, -distance)

    return sorted(courses, key=rank, reverse=True)[0]
