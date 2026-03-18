import { useState, useEffect } from "react";

function Profile() {
  const [streak, setStreak] = useState(null);
  const [semester, setSemester] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // TODO: GET /streaks/current → setStreak({ count, lastDate })
    // TODO: GET /semester/current → setSemester({ name, startDate, endDate })
    // TODO: GET /sessions → setSessions([...]) — fetch user's session history

    const saved = JSON.parse(localStorage.getItem("writingSessions") || "[]");
    setSessions(saved);
  }, []);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const activeDays = sessions.length;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-text mb-8">Profile</h1>

      {/* User Info */}
      <div className="bg-background rounded-xl shadow p-8 mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-6">
          Account Info
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-muted">Name</label>
            <p className="text-lg text-text font-medium mt-1">Mock User</p>
          </div>
          <div>
            <label className="text-sm text-muted">Department</label>
            <p className="text-lg text-text font-medium mt-1">
              Computer Science
            </p>
          </div>
          <div>
            <label className="text-sm text-muted">Email</label>
            <p className="text-lg text-text font-medium mt-1">
              user@villanova.edu
            </p>
          </div>
          <div>
            <label className="text-sm text-muted">Semester</label>
            <p className="text-lg text-text font-medium mt-1">
              {semester?.name || "\u2014"}
            </p>
          </div>
        </div>
      </div>

      {/* Current Semester Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-background rounded-xl shadow p-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Total Time
          </div>
          <div className="text-2xl font-bold text-text font-mono">
            {formatTime(totalTime)}
          </div>
        </div>
        <div className="bg-background rounded-xl shadow p-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Longest Streak
          </div>
          <div className="text-2xl font-bold text-text">
            {streak ? `${streak.count} days` : "0"}
          </div>
        </div>
        <div className="bg-background rounded-xl shadow p-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Active Days
          </div>
          <div className="text-2xl font-bold text-text">{activeDays}</div>
        </div>
      </div>

      {/* Session History */}
      <div className="bg-background rounded-xl shadow p-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-6">
          Session History
        </h2>
        {sessions.length === 0 ? (
          <p className="text-base text-muted">No sessions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions
              .slice()
              .reverse()
              .map((session, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl border border-accent/20"
                >
                  <div>
                    <span className="text-base font-medium text-text">
                      {session.date}
                    </span>
                    <span className="text-sm text-muted ml-4 italic">
                      &ldquo;{session.description}&rdquo;
                    </span>
                  </div>
                  <span className="text-base font-mono text-muted">
                    {formatTime(session.duration)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
