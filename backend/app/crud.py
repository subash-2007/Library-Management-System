from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from sqlalchemy import func, or_, and_, desc
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from . import models, schemas


# ================= SETTINGS HELPERS =================
DEFAULT_SETTINGS = {
    "late_fee_per_day": "5.0",
    "default_borrow_period_days": "14",
    "library_name": "Auspify Central Library",
    "max_books_per_member": "5",
    "currency_symbol": "₹",
}


def get_setting_value(db: Session, key: str, default: Optional[str] = None) -> str:
    setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    if setting:
        return setting.value
    return default if default is not None else DEFAULT_SETTINGS.get(key, "")


def init_default_settings(db: Session):
    for key, val in DEFAULT_SETTINGS.items():
        existing = db.query(models.Setting).filter(models.Setting.key == key).first()
        if not existing:
            db.add(models.Setting(key=key, value=val))
    db.commit()


# ================= BOOKS =================
def get_books(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    availability: Optional[str] = None,  # "available", "issued", "all"
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[models.Book], int]:
    query = db.query(models.Book)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Book.title.ilike(search_fmt),
                models.Book.author.ilike(search_fmt),
                models.Book.isbn.ilike(search_fmt),
                models.Book.publisher.ilike(search_fmt),
            )
        )

    if category and category.lower() != "all":
        query = query.filter(models.Book.category == category)

    if availability == "available":
        query = query.filter(models.Book.available_copies > 0)
    elif availability == "issued" or availability == "unavailable":
        query = query.filter(models.Book.available_copies == 0)

    total = query.count()
    books = query.order_by(desc(models.Book.id)).offset(skip).limit(limit).all()
    return books, total


def get_book(db: Session, book_id: int) -> Optional[models.Book]:
    return db.query(models.Book).filter(models.Book.id == book_id).first()


def get_book_by_isbn(db: Session, isbn: str) -> Optional[models.Book]:
    return db.query(models.Book).filter(models.Book.isbn == isbn.strip()).first()


def create_book(db: Session, book_in: schemas.BookCreate) -> models.Book:
    existing = get_book_by_isbn(db, book_in.isbn)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book with ISBN '{book_in.isbn}' already exists."
        )

    db_book = models.Book(
        isbn=book_in.isbn.strip(),
        title=book_in.title.strip(),
        author=book_in.author.strip(),
        publisher=book_in.publisher.strip() if book_in.publisher else None,
        category=book_in.category.strip(),
        publication_year=book_in.publication_year,
        total_copies=book_in.total_copies,
        available_copies=book_in.total_copies,
        shelf_location=book_in.shelf_location.strip() if book_in.shelf_location else None,
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def update_book(db: Session, book_id: int, book_in: schemas.BookUpdate) -> models.Book:
    db_book = get_book(db, book_id)
    if not db_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found."
        )

    update_data = book_in.model_dump(exclude_unset=True)

    if "isbn" in update_data and update_data["isbn"]:
        new_isbn = update_data["isbn"].strip()
        if new_isbn != db_book.isbn:
            other = get_book_by_isbn(db, new_isbn)
            if other and other.id != book_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Another book with ISBN '{new_isbn}' already exists."
                )
            db_book.isbn = new_isbn

    # Adjust available copies if total_copies changed
    if "total_copies" in update_data and update_data["total_copies"] is not None:
        new_total = update_data["total_copies"]
        issued_count = db_book.total_copies - db_book.available_copies
        if new_total < issued_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reduce total copies below currently issued count ({issued_count})."
            )
        db_book.available_copies = new_total - issued_count
        db_book.total_copies = new_total

    for field in ["title", "author", "publisher", "category", "publication_year", "shelf_location"]:
        if field in update_data:
            val = update_data[field]
            if isinstance(val, str):
                val = val.strip()
            setattr(db_book, field, val)

    db.commit()
    db.refresh(db_book)
    return db_book


def delete_book(db: Session, book_id: int) -> bool:
    db_book = get_book(db, book_id)
    if not db_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found."
        )

    # Check if there are any active issued loans
    active_tx = db.query(models.Transaction).filter(
        models.Transaction.book_id == book_id,
        models.Transaction.status == "Issued"
    ).first()
    if active_tx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete book while copies are currently issued to members."
        )

    db.delete(db_book)
    db.commit()
    return True


# ================= MEMBERS =================
def get_members(
    db: Session,
    search: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[models.Member], int]:
    query = db.query(models.Member)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Member.full_name.ilike(search_fmt),
                models.Member.member_id.ilike(search_fmt),
                models.Member.email.ilike(search_fmt),
                models.Member.phone.ilike(search_fmt),
                models.Member.department.ilike(search_fmt),
            )
        )

    if department and department.lower() != "all":
        query = query.filter(models.Member.department == department)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(models.Member.status == status_filter)

    total = query.count()
    members = query.order_by(desc(models.Member.id)).offset(skip).limit(limit).all()
    return members, total


def get_member(db: Session, member_id: int) -> Optional[models.Member]:
    return db.query(models.Member).filter(models.Member.id == member_id).first()


def get_member_by_code(db: Session, code: str) -> Optional[models.Member]:
    return db.query(models.Member).filter(models.Member.member_id == code.strip()).first()


def get_member_by_email(db: Session, email: str) -> Optional[models.Member]:
    return db.query(models.Member).filter(models.Member.email == email.strip().lower()).first()


def create_member(db: Session, member_in: schemas.MemberCreate) -> models.Member:
    if get_member_by_code(db, member_in.member_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member with ID '{member_in.member_id}' already exists."
        )

    if get_member_by_email(db, member_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member with email '{member_in.email}' already exists."
        )

    db_member = models.Member(
        member_id=member_in.member_id.strip(),
        full_name=member_in.full_name.strip(),
        email=member_in.email.strip().lower(),
        phone=member_in.phone.strip() if member_in.phone else None,
        department=member_in.department.strip() if member_in.department else None,
        membership_date=member_in.membership_date,
        status=member_in.status.strip() if member_in.status else "Active",
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def update_member(db: Session, member_id: int, member_in: schemas.MemberUpdate) -> models.Member:
    db_member = get_member(db, member_id)
    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found."
        )

    update_data = member_in.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"]:
        new_email = update_data["email"].strip().lower()
        if new_email != db_member.email:
            other = get_member_by_email(db, new_email)
            if other and other.id != member_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Another member with email '{new_email}' already exists."
                )
            db_member.email = new_email

    for field in ["full_name", "phone", "department", "status"]:
        if field in update_data:
            val = update_data[field]
            if isinstance(val, str):
                val = val.strip()
            setattr(db_member, field, val)

    db.commit()
    db.refresh(db_member)
    return db_member


def delete_member(db: Session, member_id: int) -> bool:
    db_member = get_member(db, member_id)
    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found."
        )

    # Check for active issued loans
    active_tx = db.query(models.Transaction).filter(
        models.Transaction.member_id == member_id,
        models.Transaction.status == "Issued"
    ).first()
    if active_tx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete member who currently has issued/unreturned books."
        )

    db.delete(db_member)
    db.commit()
    return True


# ================= TRANSACTIONS (ISSUE & RETURN) =================
def format_transaction_detail(tx: models.Transaction, db: Session) -> schemas.TransactionDetailResponse:
    today = date.today()
    late_fee_per_day = float(get_setting_value(db, "late_fee_per_day", "5.0"))

    is_overdue = False
    overdue_days = 0
    calculated_late_fee = tx.late_fee

    if tx.status == "Issued":
        if today > tx.due_date:
            is_overdue = True
            overdue_days = (today - tx.due_date).days
            calculated_late_fee = round(overdue_days * late_fee_per_day, 2)
    elif tx.status == "Returned" and tx.return_date:
        if tx.return_date > tx.due_date:
            is_overdue = True
            overdue_days = (tx.return_date - tx.due_date).days
            calculated_late_fee = tx.late_fee

    return schemas.TransactionDetailResponse(
        id=tx.id,
        book_id=tx.book_id,
        member_id=tx.member_id,
        issue_date=tx.issue_date,
        due_date=tx.due_date,
        return_date=tx.return_date,
        status="Overdue" if (tx.status == "Issued" and is_overdue) else tx.status,
        late_fee=tx.late_fee,
        notes=tx.notes,
        created_at=tx.created_at,
        book_title=tx.book.title if tx.book else "Unknown Book",
        book_isbn=tx.book.isbn if tx.book else "Unknown ISBN",
        member_name=tx.member.full_name if tx.member else "Unknown Member",
        member_code=tx.member.member_id if tx.member else "Unknown Code",
        is_overdue=is_overdue,
        overdue_days=overdue_days,
        calculated_late_fee=calculated_late_fee,
    )


def issue_book(db: Session, req: schemas.IssueBookRequest) -> schemas.TransactionDetailResponse:
    # 1. Validate Book
    book = get_book(db, req.book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {req.book_id} not found."
        )

    if book.available_copies <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot issue '{book.title}': No available copies left in library."
        )

    # 2. Validate Member
    member = get_member(db, req.member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {req.member_id} not found."
        )

    if member.status.lower() != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member '{member.full_name}' is currently {member.status}. Only Active members can borrow books."
        )

    # Check member limit
    max_books = int(get_setting_value(db, "max_books_per_member", "5"))
    current_issued = db.query(models.Transaction).filter(
        models.Transaction.member_id == req.member_id,
        models.Transaction.status == "Issued"
    ).count()

    if current_issued >= max_books:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member '{member.full_name}' has already borrowed maximum allowed books ({max_books})."
        )

    # 3. Calculate Dates
    issue_date = req.issue_date or date.today()
    default_period = int(get_setting_value(db, "default_borrow_period_days", "14"))
    borrow_days = req.borrow_days or default_period
    due_date = issue_date + timedelta(days=borrow_days)

    # 4. Decrement available copies (ensure never negative)
    book.available_copies = max(0, book.available_copies - 1)

    # 5. Create Transaction
    tx = models.Transaction(
        book_id=req.book_id,
        member_id=req.member_id,
        issue_date=issue_date,
        due_date=due_date,
        return_date=None,
        status="Issued",
        late_fee=0.0,
        notes=req.notes,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return format_transaction_detail(tx, db)


def return_book(db: Session, req: schemas.ReturnBookRequest) -> schemas.TransactionDetailResponse:
    tx = db.query(models.Transaction).filter(models.Transaction.id == req.transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {req.transaction_id} not found."
        )

    if tx.status == "Returned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This book transaction has already been marked as returned."
        )

    return_date = req.return_date or date.today()
    if return_date < tx.issue_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Return date cannot precede issue date."
        )

    # Calculate late fee
    late_fee_per_day = float(get_setting_value(db, "late_fee_per_day", "5.0"))
    overdue_days = 0
    late_fee = 0.0

    if return_date > tx.due_date:
        overdue_days = (return_date - tx.due_date).days
        late_fee = round(overdue_days * late_fee_per_day, 2)

    tx.return_date = return_date
    tx.status = "Returned"
    tx.late_fee = late_fee
    if req.notes:
        tx.notes = f"{tx.notes or ''} [Return Note: {req.notes}]".strip()

    # Re-increment available copies
    book = tx.book
    if book:
        book.available_copies = min(book.total_copies, book.available_copies + 1)

    db.commit()
    db.refresh(tx)

    return format_transaction_detail(tx, db)


def get_transactions(
    db: Session,
    status_filter: Optional[str] = None,
    member_id: Optional[int] = None,
    book_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[schemas.TransactionDetailResponse], int]:
    query = db.query(models.Transaction)

    if member_id:
        query = query.filter(models.Transaction.member_id == member_id)

    if book_id:
        query = query.filter(models.Transaction.book_id == book_id)

    if status_filter:
        if status_filter.lower() == "returned":
            query = query.filter(models.Transaction.status == "Returned")
        elif status_filter.lower() == "issued":
            query = query.filter(models.Transaction.status == "Issued")
        elif status_filter.lower() == "overdue":
            today = date.today()
            query = query.filter(
                models.Transaction.status == "Issued",
                models.Transaction.due_date < today
            )

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.join(models.Book).join(models.Member).filter(
            or_(
                models.Book.title.ilike(search_fmt),
                models.Book.isbn.ilike(search_fmt),
                models.Member.full_name.ilike(search_fmt),
                models.Member.member_id.ilike(search_fmt),
            )
        )

    total = query.count()
    txs = query.order_by(desc(models.Transaction.id)).offset(skip).limit(limit).all()

    detailed_txs = [format_transaction_detail(tx, db) for tx in txs]
    return detailed_txs, total


# ================= DASHBOARD METRICS =================
def get_dashboard_stats(db: Session) -> schemas.DashboardStats:
    today = date.today()

    total_books = db.query(func.coalesce(func.sum(models.Book.total_copies), 0)).scalar() or 0
    available_books = db.query(func.coalesce(func.sum(models.Book.available_copies), 0)).scalar() or 0
    issued_books = total_books - available_books
    total_members = db.query(models.Member).count()

    overdue_books = db.query(models.Transaction).filter(
        models.Transaction.status == "Issued",
        models.Transaction.due_date < today
    ).count()

    books_returned_today = db.query(models.Transaction).filter(
        models.Transaction.status == "Returned",
        models.Transaction.return_date == today
    ).count()

    # Monthly statistics (Last 6 months)
    monthly_stats: List[schemas.MonthlyStat] = []
    for i in range(5, -1, -1):
        target_month_date = today.replace(day=1) - timedelta(days=i * 28)
        month_label = target_month_date.strftime("%b %Y")
        start_of_month = target_month_date.replace(day=1)
        next_month = (start_of_month + timedelta(days=32)).replace(day=1)

        issued_cnt = db.query(models.Transaction).filter(
            models.Transaction.issue_date >= start_of_month,
            models.Transaction.issue_date < next_month
        ).count()

        returned_cnt = db.query(models.Transaction).filter(
            models.Transaction.return_date >= start_of_month,
            models.Transaction.return_date < next_month
        ).count()

        monthly_stats.append(
            schemas.MonthlyStat(
                month=month_label,
                issued_count=issued_cnt,
                returned_count=returned_cnt,
            )
        )

    # Category distribution
    categories = db.query(
        models.Book.category,
        func.sum(models.Book.total_copies).label("count")
    ).group_by(models.Book.category).all()

    category_stats = [
        schemas.CategoryStat(category=cat or "Uncategorized", count=cnt or 0)
        for cat, cnt in categories
    ]

    # Most borrowed books
    most_borrowed_q = db.query(
        models.Transaction.book_id,
        func.count(models.Transaction.id).label("borrow_count")
    ).group_by(models.Transaction.book_id).order_by(desc("borrow_count")).limit(5).all()

    most_borrowed_books = []
    for book_id, count in most_borrowed_q:
        book = get_book(db, book_id)
        if book:
            most_borrowed_books.append(
                schemas.MostBorrowedBook(
                    id=book.id,
                    title=book.title,
                    author=book.author,
                    borrow_count=count
                )
            )

    # Recent transactions
    recent_txs_raw = db.query(models.Transaction).order_by(desc(models.Transaction.id)).limit(6).all()
    recent_transactions = [format_transaction_detail(tx, db) for tx in recent_txs_raw]

    return schemas.DashboardStats(
        total_books=total_books,
        available_books=available_books,
        issued_books=issued_books,
        total_members=total_members,
        overdue_books=overdue_books,
        books_returned_today=books_returned_today,
        monthly_stats=monthly_stats,
        category_stats=category_stats,
        most_borrowed_books=most_borrowed_books,
        recent_transactions=recent_transactions,
    )
