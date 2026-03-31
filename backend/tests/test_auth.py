from tests.conftest import auth_headers, login_user, register_user


def test_register_login_and_me_flow(client):
    register_payload = register_user(client, "student@example.com")

    assert register_payload["token_type"] == "bearer"
    assert register_payload["user"]["email"] == "student@example.com"

    login_payload = login_user(client, "student@example.com")
    token = login_payload["access_token"]

    me_response = client.get("/auth/me", headers=auth_headers(token))

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "student@example.com"


def test_login_fails_with_wrong_password(client):
    register_user(client, "wrongpass@example.com")

    response = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "Wrong123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_protected_route_requires_token(client):
    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing authentication token"
