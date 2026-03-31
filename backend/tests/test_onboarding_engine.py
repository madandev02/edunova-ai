from app.models.course import Course
from app.onboarding.engine import assessment_percentage, choose_first_course, infer_level


def test_weighted_assessment_percentage():
    answers = [
        {'question_id': 'q1', 'difficulty': 'FOUNDATIONAL', 'correct': True},
        {'question_id': 'q2', 'difficulty': 'INTERMEDIATE', 'correct': False},
        {'question_id': 'q3', 'difficulty': 'ADVANCED', 'correct': True},
    ]

    percentage = assessment_percentage(answers)

    assert percentage is not None
    assert round(percentage, 2) == 67.74


def test_infer_level_blends_experience_and_assessment():
    answers = [
        {'question_id': 'q1', 'difficulty': 'FOUNDATIONAL', 'correct': True},
        {'question_id': 'q2', 'difficulty': 'INTERMEDIATE', 'correct': True},
        {'question_id': 'q3', 'difficulty': 'ADVANCED', 'correct': False},
    ]

    level = infer_level('BEGINNER', answers)

    assert level == 'INTERMEDIATE'


def test_choose_first_course_prefers_level_fit_when_goal_matches():
    courses = [
        Course(id=1, title='Beginner AI', description='d', category='AI', difficulty='beginner'),
        Course(id=2, title='Intermediate AI', description='d', category='AI', difficulty='intermediate'),
        Course(id=3, title='Advanced AI', description='d', category='AI', difficulty='advanced'),
    ]

    selected = choose_first_course(
        courses=courses,
        goal='Learn new skill',
        interests=['ai'],
        learner_level='INTERMEDIATE',
    )

    assert selected is not None
    assert selected.title == 'Intermediate AI'
