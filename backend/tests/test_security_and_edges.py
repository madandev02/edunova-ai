from tests.conftest import auth_headers, register_user, set_user_role


def test_auth_requires_token_for_protected_route(client):
    # Validates authentication guard: protected endpoint must reject missing token.
    response = client.get('/auth/me')

    assert response.status_code == 401
    assert response.json()['detail'] == 'Missing authentication token'


def test_student_cannot_access_instructor_action(client, db_session):
    # Validates RBAC: students cannot use instructor-only course creation endpoint.
    student_token = register_user(client, 'edge-student@test.com')['access_token']
    set_user_role(db_session, email='edge-student@test.com', role='student')

    response = client.post(
        '/instructor/courses',
        json={
            'title': 'Restricted Course',
            'description': 'Should be forbidden',
            'category': 'backend',
            'difficulty': 'beginner',
            'is_premium': False,
        },
        headers=auth_headers(student_token),
    )

    assert response.status_code == 403


def test_invalid_payload_returns_422(client):
    # Validates request schema enforcement: short password fails field constraints.
    response = client.post(
        '/auth/register',
        json={
            'email': 'invalid-payload@test.com',
            'password': '123',
        },
    )

    assert response.status_code == 422


def test_non_existing_course_returns_404(client):
    # Validates not-found handling for resources that do not exist.
    token = register_user(client, 'missing-resource@test.com')['access_token']

    response = client.get('/courses/999999', headers=auth_headers(token))

    assert response.status_code == 404
    assert response.json()['detail'] == 'Course not found'


def test_assistant_chat_response_exists(client):
    # Validates assistant contract: chat endpoint returns a non-empty reply body.
    token = register_user(client, 'edge-assistant@test.com')['access_token']

    response = client.post(
        '/assistant/chat',
        json={'message': 'Give me a quick study tip.'},
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get('reply'), str)
    assert payload['reply'].strip() != ''
