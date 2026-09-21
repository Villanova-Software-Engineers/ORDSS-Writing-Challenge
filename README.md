# ORDSS Writing Challenge

A web app for a semester-long writing challenge. Students join a semester with an access code from their professor, time their writing sessions, build daily streaks, and compete on a leaderboard. Professors get an admin panel to run semesters and manage users.

## How it is built

| Part | Tech | Hosted on |
|---|---|---|
| `frontend/` | React 19, Vite, Tailwind, React Query | Vercel |
| `backend/` | Python, FastAPI, SQLAlchemy, Alembic | Render |
| Database | PostgreSQL | Neon (through Vercel) |
| Login | Firebase Auth, plus a small Firestore document per user for name | Firebase |

## Running it locally

You need Python 3.11+, Node 20+, a Postgres database, and a Firebase project with Email/Password sign-in and Firestore enabled.

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Create `backend/.env`:

```
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
FIREBASE_CRED_PATH=C:\path\to\firebase-service-account.json
CORS_ORIGINS=http://localhost:5173
DEBUG=false
```

Create the tables, then start the server:

```
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Check it at http://localhost:8000/api/health. The full API is at http://localhost:8000/docs.

Note: on a brand-new empty database `alembic upgrade head` fails, because an early migration expects tables from before migrations existed. Workaround: create the tables from the models, then mark migrations as applied.

```
python -c "from app.core.database import Base, engine; import app.models; Base.metadata.create_all(engine)"
alembic stamp head
```

### Frontend

```
cd frontend
npm install
```

Create `frontend/.env` with your Firebase web app config (Firebase console, Project settings, Your apps):

```
VITE_BACKEND_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Then:

```
npm run dev
```

Open http://localhost:5173.

### Making yourself an admin

Admins are users with an `admin: true` custom claim in Firebase. Set it once with the Admin SDK using your service account file, then sign out and back in:

```
python -c "import firebase_admin; from firebase_admin import credentials, auth; firebase_admin.initialize_app(credentials.Certificate('PATH_TO_KEY.json')); u=auth.get_user_by_email('you@example.com'); auth.set_custom_user_claims(u.uid, {'admin': True})"
```

## How the app flows

1. Sign up with email and password. A verification email is sent and you must verify before signing in.
2. Sign in, then enter the semester access code from your professor. Admins skip this.
3. Dashboard shows a timer. Save a session with a short description. Sessions are capped at 11:59 PM Eastern on the day they started.
4. Streaks count consecutive days with a saved session. The leaderboard ranks by streak, then active days, then total time.
5. Admins create and end semesters at `/admin`. Only one semester is active at a time. Ending a semester archives its sessions, messages, and leaderboard.

## Deployment notes

- The backend on Render sleeps when idle. The frontend shows a "server starting" screen and polls until it is back.
- The database drops idle connections after about 5 minutes. The backend engine uses `pool_pre_ping` so a dropped connection is replaced automatically instead of failing the first request.
- Rules, indexes, and environment variables live in the Render, Vercel, and Firebase consoles, not in this repo. Deploying code does not change them.
