import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app import crud, models

# In-memory database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    crud.init_default_settings(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_book_crud_and_stock():
    # 1. Create Book
    book_payload = {
        "isbn": "978-0132350884",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "publisher": "Prentice Hall",
        "category": "Software Engineering",
        "publication_year": 2008,
        "total_copies": 2,
        "shelf_location": "Rack A1"
    }
    res = client.post("/api/books", json=book_payload)
    assert res.status_code == 201
    book_data = res.json()
    book_id = book_data["id"]
    assert book_data["available_copies"] == 2

    # 2. Duplicate ISBN rejection
    res_dup = client.post("/api/books", json=book_payload)
    assert res_dup.status_code == 400

    # 3. Read Book
    res_get = client.get(f"/api/books/{book_id}")
    assert res_get.status_code == 200
    assert res_get.json()["title"] == "Clean Code"

    # 4. Update Book
    res_update = client.put(f"/api/books/{book_id}", json={"title": "Clean Code (Updated)"})
    assert res_update.status_code == 200
    assert res_update.json()["title"] == "Clean Code (Updated)"


def test_member_crud():
    member_payload = {
        "member_id": "AUSP-001",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "department": "Computer Science",
        "status": "Active"
    }
    res = client.post("/api/members", json=member_payload)
    assert res.status_code == 201
    member_id = res.json()["id"]

    # Read member
    res_get = client.get(f"/api/members/{member_id}")
    assert res_get.status_code == 200
    assert res_get.json()["email"] == "john.doe@example.com"

    # Duplicate code or email rejected
    res_dup = client.post("/api/members", json=member_payload)
    assert res_dup.status_code == 400


def test_issue_and_return_cycle_and_late_fees():
    # 1. Setup 1 book with 1 copy
    book_res = client.post("/api/books", json={
        "isbn": "111-222-333",
        "title": "FastAPI Masterclass",
        "author": "Tech Expert",
        "publisher": "AusPress",
        "category": "Web Dev",
        "publication_year": 2024,
        "total_copies": 1,
        "shelf_location": "Rack W1"
    })
    book_id = book_res.json()["id"]

    # 2. Setup Active Member
    mem_res = client.post("/api/members", json={
        "member_id": "M-100",
        "full_name": "Alice Smith",
        "email": "alice@test.com",
        "status": "Active"
    })
    member_id = mem_res.json()["id"]

    # 3. Issue Book
    issue_payload = {
        "book_id": book_id,
        "member_id": member_id,
        "borrow_days": 14
    }
    issue_res = client.post("/api/transactions/issue", json=issue_payload)
    assert issue_res.status_code == 201
    tx_data = issue_res.json()
    tx_id = tx_data["id"]
    assert tx_data["status"] == "Issued"

    # Check book available copies decreased to 0
    book_after_issue = client.get(f"/api/books/{book_id}").json()
    assert book_after_issue["available_copies"] == 0

    # 4. Attempt to issue again when 0 available copies -> MUST REJECT!
    mem_res2 = client.post("/api/members", json={
        "member_id": "M-101",
        "full_name": "Bob Miller",
        "email": "bob@test.com",
        "status": "Active"
    })
    member2_id = mem_res2.json()["id"]

    issue_fail = client.post("/api/transactions/issue", json={
        "book_id": book_id,
        "member_id": member2_id,
        "borrow_days": 14
    })
    assert issue_fail.status_code == 400
    assert "No available copies" in issue_fail.json()["detail"]

    # 5. Return the book 5 days late
    today = date.today()
    issue_date = today - timedelta(days=20)
    due_date = today - timedelta(days=6)

    # Let's adjust tx issue_date and due_date in test DB directly to simulate late return
    db = TestingSessionLocal()
    tx_db = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    tx_db.issue_date = issue_date
    tx_db.due_date = due_date
    db.commit()
    db.close()

    return_res = client.post("/api/transactions/return", json={
        "transaction_id": tx_id,
        "return_date": str(today)
    })
    assert return_res.status_code == 200
    returned_data = return_res.json()
    assert returned_data["status"] == "Returned"
    # 6 days overdue * 5.0 = 30.0
    assert returned_data["late_fee"] == 30.0

    # Verify inventory was restored to 1
    book_after_return = client.get(f"/api/books/{book_id}").json()
    assert book_after_return["available_copies"] == 1


def test_reports_and_csv_export():
    # Test JSON reports
    for rep in ["total_books", "available_books", "issued_books", "overdue_books", "member_activity", "monthly_transactions"]:
        res = client.get(f"/api/reports?type={rep}")
        assert res.status_code == 200
        assert "data" in res.json()

    # Test CSV export
    res_csv = client.get("/api/reports/export/csv?type=total_books")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
