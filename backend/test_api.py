from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("1. Health check: OK")

    # 2. List forms
    res = client.get("/api/forms")
    assert res.status_code == 200
    forms = res.json()
    assert len(forms) >= 3
    print(f"2. List forms: OK ({len(forms)} forms found)")

    # 3. Get published form by slug
    res = client.get("/api/public/product-pulse")
    assert res.status_code == 200
    pulse = res.json()
    print(f"3. Public form product-pulse: OK ({len(pulse['questions'])} questions)")

    # 4. Submit response to public form
    q1 = pulse["questions"][0]
    q2 = pulse["questions"][1]
    q3 = pulse["questions"][2]
    q4 = pulse["questions"][3]
    q5 = pulse["questions"][4]

    payload = {
        "answers": [
            {"question_id": q1["id"], "text_value": "Test User"},
            {"question_id": q2["id"], "text_value": "testuser@example.com"},
            {"question_id": q3["id"], "number_value": 5},
            {"question_id": q4["id"], "choice_id": q4["choices"][0]["id"]},
            {"question_id": q5["id"], "bool_value": True},
        ]
    }
    res = client.post("/api/public/product-pulse/submit", json=payload)
    assert res.status_code == 200, f"Submit failed: {res.text}"
    submit_res = res.json()
    print(f"4. Submit response: OK (id={submit_res['id']})")

    # 5. Form Stats
    res = client.get(f"/api/forms/{pulse['id']}/stats")
    assert res.status_code == 200
    stats = res.json()
    print(f"5. Stats check: OK (total_submissions={stats['total_submissions']})")

    # 6. CSV Export
    res = client.get(f"/api/forms/{pulse['id']}/export.csv")
    assert res.status_code == 200
    assert "attachment" in res.headers.get("content-disposition", "")
    print("6. CSV Export: OK (Content-Disposition verified)")

    print("\n>>> ALL FULLSTACK BACKEND TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_api()
