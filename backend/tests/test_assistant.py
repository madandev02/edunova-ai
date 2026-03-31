from tests.conftest import auth_headers, register_user


def test_assistant_chat_returns_structured_response(client):
    token = register_user(client, "assistant-user@example.com")["access_token"]

    response = client.post(
        "/assistant/chat",
        json={"message": "I keep making mistakes in recursion. Help me."},
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get("reply"), str)
    assert payload["reply"]
    assert "context" in payload
