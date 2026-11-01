from datetime import date, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal, Base, engine
from . import models, crud

SAMPLE_BOOKS = [
    {
        "isbn": "978-0132350884",
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author": "Robert C. Martin",
        "publisher": "Prentice Hall",
        "category": "Software Engineering",
        "publication_year": 2008,
        "total_copies": 5,
        "available_copies": 3,
        "shelf_location": "Rack SE-101",
    },
    {
        "isbn": "978-0201633610",
        "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
        "author": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        "publisher": "Addison-Wesley",
        "category": "Software Engineering",
        "publication_year": 1994,
        "total_copies": 4,
        "available_copies": 2,
        "shelf_location": "Rack SE-102",
    },
    {
        "isbn": "978-0262033848",
        "title": "Introduction to Algorithms (CLRS)",
        "author": "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
        "publisher": "MIT Press",
        "category": "Computer Science",
        "publication_year": 2009,
        "total_copies": 6,
        "available_copies": 4,
        "shelf_location": "Rack CS-201",
    },
    {
        "isbn": "978-1449355730",
        "title": "Learning Python: Powerful Object-Oriented Programming",
        "author": "Mark Lutz",
        "publisher": "O'Reilly Media",
        "category": "Programming",
        "publication_year": 2013,
        "total_copies": 4,
        "available_copies": 3,
        "shelf_location": "Rack PY-101",
    },
    {
        "isbn": "978-1491957660",
        "title": "Designing Data-Intensive Applications",
        "author": "Martin Kleppmann",
        "publisher": "O'Reilly Media",
        "category": "Database & Systems",
        "publication_year": 2017,
        "total_copies": 5,
        "available_copies": 3,
        "shelf_location": "Rack DB-301",
    },
    {
        "isbn": "978-0262035613",
        "title": "Deep Learning",
        "author": "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
        "publisher": "MIT Press",
        "category": "Artificial Intelligence",
        "publication_year": 2016,
        "total_copies": 3,
        "available_copies": 1,
        "shelf_location": "Rack AI-401",
    },
    {
        "isbn": "978-1449369415",
        "title": "Hands-On Machine Learning with Scikit-Learn and TensorFlow",
        "author": "Aurélien Géron",
        "publisher": "O'Reilly Media",
        "category": "Artificial Intelligence",
        "publication_year": 2019,
        "total_copies": 4,
        "available_copies": 3,
        "shelf_location": "Rack AI-402",
    },
    {
        "isbn": "978-0134685991",
        "title": "Effective Java (3rd Edition)",
        "author": "Joshua Bloch",
        "publisher": "Addison-Wesley",
        "category": "Programming",
        "publication_year": 2018,
        "total_copies": 3,
        "available_copies": 2,
        "shelf_location": "Rack JV-101",
    },
    {
        "isbn": "978-1118531648",
        "title": "HTML and CSS: Design and Build Websites",
        "author": "Jon Duckett",
        "publisher": "John Wiley & Sons",
        "category": "Web Development",
        "publication_year": 2011,
        "total_copies": 5,
        "available_copies": 4,
        "shelf_location": "Rack WD-105",
    },
    {
        "isbn": "978-1491950296",
        "title": "Programming TypeScript: Making Your JavaScript Applications Scale",
        "author": "Boris Cherny",
        "publisher": "O'Reilly Media",
        "category": "Web Development",
        "publication_year": 2019,
        "total_copies": 4,
        "available_copies": 3,
        "shelf_location": "Rack TS-102",
    },
    {
        "isbn": "978-0131103627",
        "title": "The C Programming Language",
        "author": "Brian W. Kernighan, Dennis M. Ritchie",
        "publisher": "Prentice Hall",
        "category": "Programming",
        "publication_year": 1988,
        "total_copies": 3,
        "available_copies": 3,
        "shelf_location": "Rack CL-101",
    },
    {
        "isbn": "978-0672337450",
        "title": "Database Systems: The Complete Book",
        "author": "Hector Garcia-Molina, Jeffrey D. Ullman, Jennifer Widom",
        "publisher": "Pearson",
        "category": "Database & Systems",
        "publication_year": 2008,
        "total_copies": 3,
        "available_copies": 2,
        "shelf_location": "Rack DB-302",
    }
]

SAMPLE_MEMBERS = [
    {
        "member_id": "AUSP-2026-001",
        "full_name": "Aarav Sharma",
        "email": "aarav.sharma@auspify.edu",
        "phone": "+91 98765 43210",
        "department": "Computer Science & Engineering",
        "membership_date": date(2025, 8, 1),
        "status": "Active",
    },
    {
        "member_id": "AUSP-2026-002",
        "full_name": "Diya Patel",
        "email": "diya.patel@auspify.edu",
        "phone": "+91 98123 45678",
        "department": "Artificial Intelligence & Data Science",
        "membership_date": date(2025, 8, 15),
        "status": "Active",
    },
    {
        "member_id": "AUSP-2026-003",
        "full_name": "Rohan Gupta",
        "email": "rohan.gupta@auspify.edu",
        "phone": "+91 97234 56789",
        "department": "Information Technology",
        "membership_date": date(2025, 9, 10),
        "status": "Active",
    },
    {
        "member_id": "AUSP-2026-004",
        "full_name": "Ananya Sen",
        "email": "ananya.sen@auspify.edu",
        "phone": "+91 99345 67890",
        "department": "Software Engineering",
        "membership_date": date(2025, 10, 5),
        "status": "Active",
    },
    {
        "member_id": "AUSP-2026-005",
        "full_name": "Vikram Malhotra",
        "email": "vikram.m@auspify.edu",
        "phone": "+91 96456 78901",
        "department": "Business Analytics",
        "membership_date": date(2025, 11, 20),
        "status": "Active",
    },
    {
        "member_id": "AUSP-2026-006",
        "full_name": "Pooja Nair",
        "email": "pooja.nair@auspify.edu",
        "phone": "+91 95567 89012",
        "department": "Electronics & Communication",
        "membership_date": date(2026, 1, 15),
        "status": "Suspended",
    },
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        crud.init_default_settings(db)

        # Check if already seeded
        if db.query(models.Book).count() > 0:
            print("Database already contains books. Skipping seed.")
            return

        print("Seeding books...")
        created_books = []
        for b_data in SAMPLE_BOOKS:
            book = models.Book(**b_data)
            db.add(book)
            created_books.append(book)
        db.commit()

        print("Seeding members...")
        created_members = []
        for m_data in SAMPLE_MEMBERS:
            member = models.Member(**m_data)
            db.add(member)
            created_members.append(member)
        db.commit()

        # Refresh objects
        for b in created_books:
            db.refresh(b)
        for m in created_members:
            db.refresh(m)

        today = date.today()
        print("Seeding realistic transactions...")

        sample_txs = [
            # 1. Issued recently (Active, not overdue)
            models.Transaction(
                book_id=created_books[0].id,
                member_id=created_members[0].id,
                issue_date=today - timedelta(days=5),
                due_date=today + timedelta(days=9),
                return_date=None,
                status="Issued",
                late_fee=0.0,
                notes="Semester reference",
            ),
            # 2. Issued recently (Active, not overdue)
            models.Transaction(
                book_id=created_books[1].id,
                member_id=created_members[1].id,
                issue_date=today - timedelta(days=8),
                due_date=today + timedelta(days=6),
                return_date=None,
                status="Issued",
                late_fee=0.0,
                notes="Software design project",
            ),
            # 3. Issued and OVERDUE (due 4 days ago -> ₹20 late fee calculated)
            models.Transaction(
                book_id=created_books[2].id,
                member_id=created_members[2].id,
                issue_date=today - timedelta(days=18),
                due_date=today - timedelta(days=4),
                return_date=None,
                status="Issued",
                late_fee=0.0,
                notes="Exam prep",
            ),
            # 4. Issued and OVERDUE (due 10 days ago -> ₹50 late fee)
            models.Transaction(
                book_id=created_books[5].id,
                member_id=created_members[3].id,
                issue_date=today - timedelta(days=24),
                due_date=today - timedelta(days=10),
                return_date=None,
                status="Issued",
                late_fee=0.0,
                notes="Research paper study",
            ),
            # 5. Returned on time
            models.Transaction(
                book_id=created_books[3].id,
                member_id=created_members[4].id,
                issue_date=today - timedelta(days=30),
                due_date=today - timedelta(days=16),
                return_date=today - timedelta(days=17),
                status="Returned",
                late_fee=0.0,
                notes="Returned in great condition",
            ),
            # 6. Returned late with late fee ₹30 (6 days overdue)
            models.Transaction(
                book_id=created_books[4].id,
                member_id=created_members[0].id,
                issue_date=today - timedelta(days=45),
                due_date=today - timedelta(days=31),
                return_date=today - timedelta(days=25),
                status="Returned",
                late_fee=30.0,
                notes="Late fine collected",
            ),
            # 7. Returned today! (Matches "Books Returned Today" counter)
            models.Transaction(
                book_id=created_books[6].id,
                member_id=created_members[1].id,
                issue_date=today - timedelta(days=10),
                due_date=today + timedelta(days=4),
                return_date=today,
                status="Returned",
                late_fee=0.0,
                notes="Routine return",
            ),
            # 8. Another returned today!
            models.Transaction(
                book_id=created_books[7].id,
                member_id=created_members[3].id,
                issue_date=today - timedelta(days=12),
                due_date=today + timedelta(days=2),
                return_date=today,
                status="Returned",
                late_fee=0.0,
                notes="Returned today",
            ),
        ]

        for tx in sample_txs:
            db.add(tx)
        db.commit()

        print("Database successfully seeded!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
