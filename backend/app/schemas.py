from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ================= BOOK SCHEMAS =================
class BookBase(BaseModel):
    isbn: str = Field(..., min_length=3, max_length=32)
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    publisher: Optional[str] = Field(None, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    publication_year: int = Field(..., ge=1000, le=2100)
    total_copies: int = Field(..., ge=1)
    shelf_location: Optional[str] = Field(None, max_length=100)


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    isbn: Optional[str] = Field(None, min_length=3, max_length=32)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    publisher: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    publication_year: Optional[int] = Field(None, ge=1000, le=2100)
    total_copies: Optional[int] = Field(None, ge=1)
    shelf_location: Optional[str] = Field(None, max_length=100)


class BookResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    available_copies: int
    created_at: Optional[datetime] = None


# ================= MEMBER SCHEMAS =================
class MemberBase(BaseModel):
    member_id: str = Field(..., min_length=2, max_length=64)
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=32)
    department: Optional[str] = Field(None, max_length=128)
    membership_date: date = Field(default_factory=date.today)
    status: str = Field(default="Active", max_length=32)


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=32)
    department: Optional[str] = Field(None, max_length=128)
    status: Optional[str] = Field(None, max_length=32)


class MemberResponse(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None


# ================= TRANSACTION SCHEMAS =================
class IssueBookRequest(BaseModel):
    book_id: int
    member_id: int
    issue_date: Optional[date] = None
    borrow_days: Optional[int] = 14
    notes: Optional[str] = None


class ReturnBookRequest(BaseModel):
    transaction_id: int
    return_date: Optional[date] = None
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_id: int
    member_id: int
    issue_date: date
    due_date: date
    return_date: Optional[date] = None
    status: str
    late_fee: float
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class TransactionDetailResponse(TransactionResponse):
    book_title: str
    book_isbn: str
    member_name: str
    member_code: str
    is_overdue: bool
    overdue_days: int
    calculated_late_fee: float


# ================= DASHBOARD & STATS =================
class MonthlyStat(BaseModel):
    month: str
    issued_count: int
    returned_count: int


class CategoryStat(BaseModel):
    category: str
    count: int


class MostBorrowedBook(BaseModel):
    id: int
    title: str
    author: str
    borrow_count: int


class DashboardStats(BaseModel):
    total_books: int
    available_books: int
    issued_books: int
    total_members: int
    overdue_books: int
    books_returned_today: int
    monthly_stats: List[MonthlyStat]
    category_stats: List[CategoryStat]
    most_borrowed_books: List[MostBorrowedBook]
    recent_transactions: List[TransactionDetailResponse]


# ================= SETTINGS SCHEMAS =================
class SettingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    value: str
    description: Optional[str] = None


class SettingsDict(BaseModel):
    late_fee_per_day: float = 5.0
    default_borrow_period_days: int = 14
    library_name: str = "Auspify Central Library"
    max_books_per_member: int = 5
    currency_symbol: str = "₹"
