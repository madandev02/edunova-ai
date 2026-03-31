import argparse
import sys
from typing import Any

import requests


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def require_keys(payload: dict[str, Any], keys: list[str], context: str) -> None:
    missing = [key for key in keys if key not in payload]
    expect(not missing, f"{context} missing keys: {', '.join(missing)}")


def require_any_key(payload: dict[str, Any], key_options: list[str], context: str) -> None:
    if any(key in payload for key in key_options):
        return
    raise AssertionError(f"{context} missing expected keys: {' | '.join(key_options)}")


def main() -> int:
    parser = argparse.ArgumentParser(description='EduNova E2E smoke tests')
    parser.add_argument('--base-url', default='http://localhost:8000')
    args = parser.parse_args()

    base_url = args.base_url.rstrip('/')
    session = requests.Session()
    session.headers.update({'Content-Type': 'application/json'})
    timeout = 20

    print('1) Health endpoint')
    health = session.get(f'{base_url}/health', timeout=timeout)
    expect(health.status_code == 200, 'health endpoint is not reachable')

    print('2) Public catalog preview')
    public_courses = session.get(f'{base_url}/public/courses?limit=12', timeout=timeout)
    expect(public_courses.status_code == 200, 'public courses endpoint failed')
    public_courses_json = public_courses.json()
    expect(isinstance(public_courses_json, list), 'public courses payload must be a list')
    expect(len(public_courses_json) >= 6, 'seed catalog should expose at least 6 public courses')

    print('3) Authentication')
    login = session.post(
        f'{base_url}/auth/login',
        json={'email': 'demo@edunova.ai', 'password': 'Demo1234!'},
        timeout=timeout,
    )
    expect(login.status_code == 200, 'demo login failed')
    token = login.json().get('access_token')
    expect(bool(token), 'login did not return access token')
    session.headers.update({'Authorization': f'Bearer {token}'})

    print('4) Onboarding flow')
    onboarding_status = session.get(f'{base_url}/onboarding/status', timeout=timeout)
    expect(onboarding_status.status_code == 200, 'onboarding status failed')

    onboarding_payload = {
        'goal': 'Learn new skill',
        'interests': ['frontend', 'ai', 'backend'],
        'experience_level': 'INTERMEDIATE',
        'assessment_answers': [
            {'question_id': 'core-api-http-basics', 'difficulty': 'INTERMEDIATE', 'correct': True},
            {'question_id': 'core-code-reasoning', 'difficulty': 'INTERMEDIATE', 'correct': True},
            {'question_id': 'advanced-time-complexity', 'difficulty': 'ADVANCED', 'correct': False},
            {'question_id': 'advanced-backend-api-design', 'difficulty': 'ADVANCED', 'correct': True},
        ],
    }
    onboarding_complete = session.post(
        f'{base_url}/onboarding/complete',
        json=onboarding_payload,
        timeout=timeout,
    )
    expect(onboarding_complete.status_code == 200, 'onboarding complete failed')
    onboarding_complete_json = onboarding_complete.json()
    require_keys(
        onboarding_complete_json,
        ['level', 'first_course_id', 'generated_learning_path_lesson_ids'],
        'onboarding complete',
    )

    print('5) Marketplace and course detail')
    courses = session.get(f'{base_url}/courses', timeout=timeout)
    expect(courses.status_code == 200, 'courses endpoint failed')
    courses_json = courses.json()
    expect(len(courses_json) >= 6, 'private courses endpoint should expose expanded seed catalog')
    first_course_id = courses_json[0]['id']

    course_detail = session.get(f'{base_url}/courses/{first_course_id}', timeout=timeout)
    expect(course_detail.status_code == 200, 'course detail endpoint failed')
    course_detail_json = course_detail.json()
    modules = course_detail_json.get('modules', [])
    expect(len(modules) > 0, 'course detail has no modules')

    first_lesson_id = modules[0]['lessons'][0]['id']

    print('6) Learning flow and progress updates')
    lesson = session.get(f'{base_url}/lessons/{first_lesson_id}', timeout=timeout)
    expect(lesson.status_code == 200, 'lesson endpoint failed')
    lesson_json = lesson.json()
    if lesson_json.get('video_url') or lesson_json.get('videoUrl'):
      expect(
          'transcript_segments' in lesson_json or 'transcriptSegments' in lesson_json,
          'lesson payload should expose transcript segments with video metadata',
      )

    video_progress_get = session.get(f'{base_url}/progress/lessons/{first_lesson_id}/video', timeout=timeout)
    expect(video_progress_get.status_code == 200, 'video progress get endpoint failed')

    video_progress_put = session.put(
        f'{base_url}/progress/lessons/{first_lesson_id}/video',
        json={
            'playback_seconds': 120,
            'completed_section_ids': [f'{first_lesson_id}-section-1'],
            'video_duration_seconds': 540,
        },
        timeout=timeout,
    )
    expect(video_progress_put.status_code == 200, 'video progress save endpoint failed')
    require_keys(video_progress_put.json(), ['lesson_id', 'playback_seconds', 'completed_section_ids', 'completion_ratio'], 'video progress')

    transcript_notes_put = session.put(
        f'{base_url}/progress/lessons/{first_lesson_id}/transcript-notes',
        json={
            'notes': [
                {
                    'segment_id': f'{first_lesson_id}-transcript-1',
                    'highlight_text': 'important recap',
                    'note_text': 'revise this concept before quiz',
                }
            ]
        },
        timeout=timeout,
    )
    expect(transcript_notes_put.status_code == 200, 'transcript note save endpoint failed')
    expect(isinstance(transcript_notes_put.json(), list), 'transcript notes response must be list')

    transcript_notes_get = session.get(
        f'{base_url}/progress/lessons/{first_lesson_id}/transcript-notes',
        timeout=timeout,
    )
    expect(transcript_notes_get.status_code == 200, 'transcript note get endpoint failed')

    resume_items = session.get(f'{base_url}/progress/resume', timeout=timeout)
    expect(resume_items.status_code == 200, 'resume endpoint failed')
    expect(isinstance(resume_items.json(), list), 'resume endpoint payload must be list')

    submit = session.post(
        f'{base_url}/lessons/{first_lesson_id}/submit',
        json={'answer': 'A clear base case', 'time_spent_seconds': 180},
        timeout=timeout,
    )
    expect(submit.status_code == 200, 'lesson submission failed')
    submit_json = submit.json()
    require_keys(submit_json, ['score', 'feedback'], 'lesson submission')

    complete = session.post(f'{base_url}/progress/lessons/{first_lesson_id}/complete', timeout=timeout)
    expect(complete.status_code == 200, 'mark lesson complete failed')

    print('7) Recommendation, learning path, analytics, assistant, skills')
    recommendations = session.get(f'{base_url}/recommendations', timeout=timeout)
    expect(recommendations.status_code == 200, 'recommendations endpoint failed')
    expect(isinstance(recommendations.json(), list), 'recommendations must be a list')
    if recommendations.json():
        require_keys(recommendations.json()[0], ['lesson_id', 'priority', 'reason'], 'recommendation item')

    learning_path = session.get(f'{base_url}/learning-path', timeout=timeout)
    expect(learning_path.status_code == 200, 'learning path endpoint failed')
    require_keys(learning_path.json(), ['items', 'currentLessonId'], 'learning path')

    dashboard = session.get(f'{base_url}/dashboard', timeout=timeout)
    expect(dashboard.status_code == 200, 'dashboard endpoint failed')
    require_keys(
        dashboard.json(),
        ['progress', 'gamification', 'skillProfile', 'weakAreas', 'recommendations', 'recentActivity'],
        'dashboard',
    )

    analytics = session.get(f'{base_url}/analytics', timeout=timeout)
    expect(analytics.status_code == 200, 'analytics endpoint failed')
    analytics_json = analytics.json()
    require_any_key(analytics_json, ['performance_over_time', 'performanceOverTime'], 'analytics')
    require_any_key(analytics_json, ['success_rate_by_topic', 'successRateByTopic'], 'analytics')
    require_any_key(analytics_json, ['attempts_per_topic', 'attemptsPerTopic'], 'analytics')

    skills = session.get(f'{base_url}/skills', timeout=timeout)
    expect(skills.status_code == 200, 'skills endpoint failed')
    expect('skills' in skills.json(), 'skills payload missing skills field')

    assistant = session.post(
        f'{base_url}/assistant/chat',
        json={'message': 'What should I study next?'},
        timeout=timeout,
    )
    expect(assistant.status_code == 200, 'assistant endpoint failed')
    expect('reply' in assistant.json(), 'assistant payload missing reply')

    print('Smoke E2E passed')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f'Smoke E2E failed: {exc}')
        raise SystemExit(1)
