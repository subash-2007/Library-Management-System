from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas, crud

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=schemas.SettingsDict)
def get_settings(db: Session = Depends(get_db)):
    crud.init_default_settings(db)
    return schemas.SettingsDict(
        late_fee_per_day=float(crud.get_setting_value(db, "late_fee_per_day", "5.0")),
        default_borrow_period_days=int(crud.get_setting_value(db, "default_borrow_period_days", "14")),
        library_name=crud.get_setting_value(db, "library_name", "Auspify Central Library"),
        max_books_per_member=int(crud.get_setting_value(db, "max_books_per_member", "5")),
        currency_symbol=crud.get_setting_value(db, "currency_symbol", "₹"),
    )


@router.put("", response_model=schemas.SettingsDict)
def update_settings(settings_in: schemas.SettingsDict, db: Session = Depends(get_db)):
    crud.init_default_settings(db)

    fields = {
        "late_fee_per_day": str(settings_in.late_fee_per_day),
        "default_borrow_period_days": str(settings_in.default_borrow_period_days),
        "library_name": settings_in.library_name,
        "max_books_per_member": str(settings_in.max_books_per_member),
        "currency_symbol": settings_in.currency_symbol,
    }

    for key, val in fields.items():
        row = db.query(models.Setting).filter(models.Setting.key == key).first()
        if row:
            row.value = val
        else:
            db.add(models.Setting(key=key, value=val))

    db.commit()
    return settings_in
