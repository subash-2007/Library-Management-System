import io
import csv
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from .. import models, crud

router = APIRouter(prefix="/reports", tags=["Reports"])


def generate_report_data(report_type: str, db: Session) -> Dict[str, Any]:
    today = date.today()

    if report_type == "total_books":
        books = db.query(models.Book).order_by(models.Book.title).all()
        data = [
            {
                "id": b.id,
                "isbn": b.isbn,
                "title": b.title,
                "author": b.author,
                "category": b.category,
                "publisher": b.publisher or "N/A",
                "publication_year": b.publication_year,
                "total_copies": b.total_copies,
                "available_copies": b.available_copies,
                "shelf_location": b.shelf_location or "N/A",
            }
            for b in books
        ]
        return {
            "title": "Total Books Inventory Report",
            "report_type": report_type,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_records": len(data),
            "data": data,
        }

    elif report_type == "available_books":
        books = db.query(models.Book).filter(models.Book.available_copies > 0).order_by(models.Book.title).all()
        data = [
            {
                "id": b.id,
                "isbn": b.isbn,
                "title": b.title,
                "author": b.author,
                "category": b.category,
                "total_copies": b.total_copies,
                "available_copies": b.available_copies,
                "shelf_location": b.shelf_location or "N/A",
            }
            for b in books
        ]
        return {
            "title": "Available Books In Stock Report",
            "report_type": report_type,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_records": len(data),
            "data": data,
        }

    elif report_type == "issued_books":
        txs = db.query(models.Transaction).filter(models.Transaction.status == "Issued").all()
        data = []
        for tx in txs:
            detail = crud.format_transaction_detail(tx, db)
            data.append({
                "transaction_id": tx.id,
                "book_id": tx.book_id,
                "book_title": detail.book_title,
                "book_isbn": detail.book_isbn,
                "member_name": detail.member_name,
                "member_code": detail.member_code,
                "issue_date": str(tx.issue_date),
                "due_date": str(tx.due_date),
                "is_overdue": detail.is_overdue,
                "overdue_days": detail.overdue_days,
            })
        return {
            "title": "Currently Issued Books Report",
            "report_type": report_type,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_records": len(data),
            "data": data,
        }

    elif report_type == "overdue_books":
        txs = db.query(models.Transaction).filter(
            models.Transaction.status == "Issued",
            models.Transaction.due_date < today
        ).all()
        data = []
        for tx in txs:
            detail = crud.format_transaction_detail(tx, db)
            data.append({
                "transaction_id": tx.id,
                "book_title": detail.book_title,
                "member_name": detail.member_name,
                "member_code": detail.member_code,
                "issue_date": str(tx.issue_date),
                "due_date": str(tx.due_date),
                "overdue_days": detail.overdue_days,
                "accrued_late_fee": detail.calculated_late_fee,
            })
        return {
            "title": "Overdue Books & Late Fees Report",
            "report_type": report_type,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_records": len(data),
            "data": data,
        }

    elif report_type == "member_activity":
        members = db.query(models.Member).all()
        data = []
        for m in members:
            total_borrowed = db.query(models.Transaction).filter(models.Transaction.member_id == m.id).count()
            active_borrowed = db.query(models.Transaction).filter(
                models.Transaction.member_id == m.id,
                models.Transaction.status == "Issued"
            ).count()
            total_fines = db.query(func.coalesce(func.sum(models.Transaction.late_fee), 0.0)).filter(
                models.Transaction.member_id == m.id
            ).scalar() or 0.0

            data.append({
                "member_id": m.id,
                "member_code": m.member_id,
                "full_name": m.full_name,
                "email": m.email,
                "department": m.department or "N/A",
                "status": m.status,
                "total_borrowed_count": total_borrowed,
                "active_borrowed_count": active_borrowed,
                "total_paid_fines": round(total_fines, 2),
            })
        return {
            "title": "Member Activity & History Report",
            "report_type": report_type,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_records": len(data),
            "data": data,
        }

    elif report_type == "monthly_transactions":
        txs = db.query(models.Transaction).order_by(desc(models.Transaction.issue_date)).all()
        data = []
        for tx in txs:
            detail = crud.format_transaction_detail(tx, db)
            data.append({
                "transaction_id": tx.id,
                "book_title": detail.book_title,
                "member_name": detail.member_name,
                "issue_date": str(tx.issue_date),
                "due_date": str(tx.due_date),
                "return_date": str(tx.return_date) if tx.return_date else "Not Returned",
                "status": detail.status,
                "late_fee": detail.calculated_late_fee if detail.status == "Overdue" else tx.late_fee,
            })
        return {
            "title": "All Transactions Log Report",
            "report_type": report_type,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_records": len(data),
            "data": data,
        }

    else:
        raise HTTPException(status_code=400, detail=f"Invalid report type: '{report_type}'")


@router.get("")
def get_report(
    type: str = Query("total_books", description="total_books | available_books | issued_books | overdue_books | member_activity | monthly_transactions"),
    db: Session = Depends(get_db)
):
    return generate_report_data(type, db)


@router.get("/export/csv")
def export_report_csv(
    type: str = Query("total_books", description="Report type to export"),
    db: Session = Depends(get_db)
):
    report_dict = generate_report_data(type, db)
    data = report_dict["data"]

    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
        writer.writeheader()
        writer.writerows(data)
    else:
        output.write("No records found for this report\n")

    output.seek(0)
    filename = f"{type}_report_{date.today().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
