from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/members", tags=["Members"])


@router.get("", response_model=dict)
def read_members(
    search: Optional[str] = Query(None, description="Search by name, ID, email, phone"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Inactive, Suspended)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    members, total = crud.get_members(
        db, search=search, department=department, status_filter=status, skip=skip, limit=limit
    )
    return {
        "items": [schemas.MemberResponse.model_validate(m) for m in members],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{member_id}", response_model=schemas.MemberResponse)
def read_member(member_id: int, db: Session = Depends(get_db)):
    member = crud.get_member(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return schemas.MemberResponse.model_validate(member)


@router.get("/{member_id}/history", response_model=dict)
def read_member_history(member_id: int, db: Session = Depends(get_db)):
    member = crud.get_member(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    txs, total = crud.get_transactions(db, member_id=member_id, limit=200)
    active_loans = [t for t in txs if t.status in ["Issued", "Overdue"]]
    return {
        "member": schemas.MemberResponse.model_validate(member),
        "total_borrowed": total,
        "active_borrowed_count": len(active_loans),
        "transactions": txs
    }


@router.post("", response_model=schemas.MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(member_in: schemas.MemberCreate, db: Session = Depends(get_db)):
    db_member = crud.create_member(db, member_in)
    return schemas.MemberResponse.model_validate(db_member)


@router.put("/{member_id}", response_model=schemas.MemberResponse)
def update_member(member_id: int, member_in: schemas.MemberUpdate, db: Session = Depends(get_db)):
    db_member = crud.update_member(db, member_id, member_in)
    return schemas.MemberResponse.model_validate(db_member)


@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    crud.delete_member(db, member_id)
    return {"message": "Member deleted successfully"}
