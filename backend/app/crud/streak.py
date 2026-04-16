from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo
from app.models import Streak
from app.schemas.streak import StreakResponse

# Use America/New_York for consistent EST/EDT handling
EASTERN_TZ = ZoneInfo("America/New_York")


def get_user_streak(user_id: int, db: Session, semester_id: Optional[int] = None) -> Optional[Streak]:
    query = db.query(Streak).filter(Streak.user_id == user_id)
    # Always filter by semester_id to prevent showing stale data from other semesters
    # If semester_id is None, only return streaks with NULL semester_id (legacy data should not be shown)
    query = query.filter(Streak.semester_id == semester_id)
    return query.first()


def streak_to_response(streak: Optional[Streak]) -> StreakResponse:
    if not streak:
        return StreakResponse(count=0, last_date=None)

    return StreakResponse(
        count=streak.count,
        last_date=streak.last_date.isoformat() if streak.last_date else None,
    )


def update_user_streak(
    user_id: int,
    db: Session,
    semester_id: Optional[int] = None,
    session_started_at: Optional[str] = None
) -> Streak:
    # Determine the session date in EST/EDT timezone
    # If session_started_at is provided, use that date; otherwise fall back to current EST date
    if session_started_at:
        # Parse ISO format and convert to EST/EDT
        started_dt = datetime.fromisoformat(session_started_at.replace("Z", "+00:00"))
        session_date = started_dt.astimezone(EASTERN_TZ).date()
    else:
        # Fallback: use current date in EST/EDT
        session_date = datetime.now(EASTERN_TZ).date()

    streak = get_user_streak(user_id, db, semester_id)

    if not streak:
        streak = Streak(
            user_id=user_id,
            semester_id=semester_id,
            count=1,
            longest_streak=1,
            last_date=session_date,
        )
        db.add(streak)
        db.commit()
        db.refresh(streak)
        return streak

    if streak.last_date == session_date:
        return streak

    new_count = streak.count
    if streak.last_date:
        delta = (session_date - streak.last_date).days
        if delta == 1:
            new_count = streak.count + 1
        else:
            new_count = 1
    else:
        new_count = 1

    streak.count = new_count
    streak.last_date = session_date
    if new_count > streak.longest_streak:
        streak.longest_streak = new_count

    db.commit()
    db.refresh(streak)

    return streak
