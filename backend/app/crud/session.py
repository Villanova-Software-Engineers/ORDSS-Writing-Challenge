from sqlalchemy.orm import Session
from ..models.session import Session as SessionModel
from ..schemas.session import SessionStart, SessionAdminAdjustment
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")


def create_session(session: SessionStart, db: Session) -> SessionModel:
    db_session = SessionModel(
        user_id=session.user_id,
        semester_id=session.semester_id,
        description=session.description,
        status="active",
        session_date=datetime.now(NY).date(),
        start_time=datetime.now(timezone.utc)
    )
    db.add(db_session)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(db_session)
    return db_session

def get_user_sessions(user_id: int, db: Session) -> list[SessionModel]:
    return db.query(SessionModel).filter(SessionModel.user_id == user_id).all()


def get_current_session(user_id: int, db: Session) -> SessionModel | None:
    return (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user_id, SessionModel.status == "active")
        .first()
    )

# 
def adjust_session_admin(adjustment: SessionAdminAdjustment, db: Session):
    db_session = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == adjustment.user_id, SessionModel.session_date == adjustment.session_date)
        .first()
    )
    if not db_session:
        return None
    db_session.duration = adjustment.duration
    db.commit()
    db.refresh(db_session)
    return db_session


def hard_stop_session(session_date: date) -> datetime:
    local_cutoff = datetime.combine(session_date, time(23, 59, 59))
    local_cutoff = local_cutoff.replace(tzinfo=NY)
    utc_cutoff = local_cutoff.astimezone(timezone.utc).replace(tzinfo=None)
    return utc_cutoff


#hard stop and stop
#est

def stop_session(user_id: int, db: Session) -> SessionModel | None:
    active_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user_id, SessionModel.status == "active")
        .all()
    )

    if len(active_sessions) > 1:
        raise ValueError("Multiple active sessions found for the user.")
    if len(active_sessions) == 0:
        return None

    db_session = active_sessions[0]
    db_session.status = "stopped"
    now_utc = now_utc = datetime.now(timezone.utc)
    cutoff_utc = hard_stop_session(db_session.session_date)
    db_session.end_time = min(now_utc, cutoff_utc)

    db_session.duration = int(
        (db_session.end_time - db_session.start_time).total_seconds() / 60
    )

    db.commit()
    db.refresh(db_session)
    return db_session

#hastag above all admin stuf 
#admin functions all in one file check it out







    