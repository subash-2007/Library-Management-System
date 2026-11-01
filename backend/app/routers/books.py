from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("", response_model=dict)
def read_books(
    search: Optional[str] = Query(None, description="Search by title, author, isbn, publisher"),
    category: Optional[str] = Query(None, description="Filter by category"),
    availability: Optional[str] = Query(None, description="available | issued | all"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    books, total = crud.get_books(
        db, search=search, category=category, availability=availability, skip=skip, limit=limit
    )
    return {
        "items": [schemas.BookResponse.model_validate(b) for b in books],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{book_id}", response_model=schemas.BookResponse)
def read_book(book_id: int, db: Session = Depends(get_db)):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return schemas.BookResponse.model_validate(book)


@router.post("", response_model=schemas.BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book_in: schemas.BookCreate, db: Session = Depends(get_db)):
    db_book = crud.create_book(db, book_in)
    return schemas.BookResponse.model_validate(db_book)


@router.put("/{book_id}", response_model=schemas.BookResponse)
def update_book(book_id: int, book_in: schemas.BookUpdate, db: Session = Depends(get_db)):
    db_book = crud.update_book(db, book_id, book_in)
    return schemas.BookResponse.model_validate(db_book)


@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    crud.delete_book(db, book_id)
    return {"message": "Book deleted successfully"}
