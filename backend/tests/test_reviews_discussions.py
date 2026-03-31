from tests.conftest import auth_headers, register_user, set_user_role


def create_course_for_discussion_and_review(client, db_session) -> tuple[int, str]:
    token = register_user(client, "instructor-rd@example.com")["access_token"]
    set_user_role(db_session, email="instructor-rd@example.com", role="instructor")

    response = client.post(
        "/instructor/courses",
        json={
            "title": "Community Course",
            "description": "For reviews and discussion tests",
            "category": "backend",
            "difficulty": "beginner",
            "is_premium": False,
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 200, response.text
    return response.json()["id"], token


def test_create_review_and_get_review_stats(client, db_session):
    course_id, _ = create_course_for_discussion_and_review(client, db_session)
    student_token = register_user(client, "reviewer@example.com")["access_token"]

    create_response = client.post(
        f"/courses/{course_id}/reviews",
        json={"rating": 5, "comment": "Great course"},
        headers=auth_headers(student_token),
    )

    assert create_response.status_code == 200
    assert create_response.json()["rating"] == 5

    list_response = client.get(f"/courses/{course_id}/reviews")

    assert list_response.status_code == 200
    payload = list_response.json()
    assert payload["total"] == 1
    assert payload["stats"]["total_reviews"] == 1


def test_review_rating_validation(client, db_session):
    course_id, _ = create_course_for_discussion_and_review(client, db_session)
    student_token = register_user(client, "invalid-review@example.com")["access_token"]

    response = client.post(
        f"/courses/{course_id}/reviews",
        json={"rating": 9, "comment": "Too high"},
        headers=auth_headers(student_token),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Rating must be between 1 and 5"


def test_create_discussion_and_reply(client, db_session):
    course_id, _ = create_course_for_discussion_and_review(client, db_session)
    student_token = register_user(client, "discuss@example.com")["access_token"]

    thread_response = client.post(
        f"/courses/{course_id}/discussions",
        json={"body": "How does this work?", "kind": "question"},
        headers=auth_headers(student_token),
    )
    assert thread_response.status_code == 200
    thread_id = thread_response.json()["id"]

    reply_response = client.post(
        f"/courses/{course_id}/discussions",
        json={"body": "It works with API routes.", "kind": "answer", "parent_id": thread_id},
        headers=auth_headers(student_token),
    )
    assert reply_response.status_code == 200

    list_response = client.get(f"/courses/{course_id}/discussions")
    assert list_response.status_code == 200

    threads = list_response.json()["items"]
    assert len(threads) == 1
    assert len(threads[0]["replies"]) == 1
