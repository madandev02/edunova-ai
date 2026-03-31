from tests.conftest import auth_headers, register_user, set_user_role


def test_instructor_can_create_course_and_student_can_list_it(client, db_session):
    instructor_token = register_user(client, "instructor@example.com")["access_token"]
    set_user_role(db_session, email="instructor@example.com", role="instructor")

    create_response = client.post(
        "/instructor/courses",
        json={
            "title": "Intro to FastAPI",
            "description": "Build APIs",
            "category": "backend",
            "difficulty": "beginner",
            "is_premium": False,
        },
        headers=auth_headers(instructor_token),
    )

    assert create_response.status_code == 200, create_response.text
    created_course = create_response.json()
    assert created_course["title"] == "Intro to FastAPI"

    student_token = register_user(client, "student-course@example.com")["access_token"]
    list_response = client.get("/courses", headers=auth_headers(student_token))

    assert list_response.status_code == 200
    courses = list_response.json()
    assert any(course["id"] == created_course["id"] for course in courses)


def test_student_cannot_create_instructor_course(client):
    student_token = register_user(client, "forbidden-student@example.com")["access_token"]

    response = client.post(
        "/instructor/courses",
        json={
            "title": "Should Fail",
            "description": "No permission",
            "category": "backend",
            "difficulty": "beginner",
            "is_premium": False,
        },
        headers=auth_headers(student_token),
    )

    assert response.status_code == 403
