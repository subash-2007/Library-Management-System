from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/issue", response_model=schemas.TransactionDetailResponse, status_code=status.HTTP_201_CREATED)
def issue_book(req: schemas.IssueBookRequest, db: Session = Depends(get_db)):
    return crud.issue_book(db, req)


@router.post("/return", response_model=schemas.TransactionDetailResponse)
def return_book(req: schemas.ReturnBookRequest, db: Session = Depends(get_db)):
    return crud.return_book(db, req)


@router.get("", response_model=dict)
def read_transactions(
    status: Optional[str] = Query(None, description="issued | returned | overdue"),
    member_id: Optional[int] = Query(None),
    book_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None, description="Search by book title or member name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    txs, total = crud.get_transactions(
        db, status_filter=status, member_id=member_id, book_id=book_id, search=search, skip=skip, limit=limit
    )
    return {
        "items": txs,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@router.get("/{tx_id}", response_model=schemas.TransactionDetailResponse)
def get_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return crud.format_transaction_detail(tx, db)
