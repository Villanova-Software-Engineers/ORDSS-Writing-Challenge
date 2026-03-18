import { useState, useEffect, useCallback } from "react";
import Timer from "./Timer";

function Dashboard() {
  const [streak, setStreak] = useState(null);
  const [semester, setSemester] = useState(null);
  const [todayWritingTime, setTodayWritingTime] = useState(0);
  const [sessionSaved, setSessionSaved] = useState(false);

  useEffect(() => {
    // TODO: GET /streaks/current → setStreak({ count, lastDate })
    // TODO: GET /semester/current → setSemester({ name, startDate, endDate })
    // TODO: GET /sessions/today → check if session already exists today
  }, []);

  const handleTimerUpdate = useCallback((seconds) => {
    setTodayWritingTime(seconds);
  }, []);

  const handleSessionSave = useCallback((session) => {
    setSessionSaved(true);
    setTodayWritingTime(session.duration);
    // TODO: POST /sessions → start session, then PATCH /sessions/{id} → stop session
    // TODO: GET /streaks/current → refresh streak after save
  }, []);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text">Dashboard</h1>
        {semester && (
          <p className="text-base text-muted mt-1">{semester.name}</p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-background rounded-xl shadow p-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Session Status
          </div>
          <div
            className={`text-2xl font-bold ${
              sessionSaved
                ? "text-green-600"
                : todayWritingTime > 0
                  ? "text-primary"
                  : "text-muted"
            }`}
          >
            {sessionSaved
              ? "Completed"
              : todayWritingTime > 0
                ? "Active"
                : "Not Started"}
          </div>
        </div>

        <div className="bg-background rounded-xl shadow p-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Current Streak
          </div>
          <div className="text-2xl font-bold text-text">
            {streak
              ? `${streak.count} day${streak.count !== 1 ? "s" : ""}`
              : "\u2014"}
          </div>
        </div>

        <div className="bg-background rounded-xl shadow p-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Today's Writing Time
          </div>
          <div className="text-2xl font-bold text-text font-mono">
            {formatTime(todayWritingTime)}
          </div>
        </div>
      </div>

      {/* Timer Card */}
      <div className="bg-background rounded-xl shadow p-10">
        <Timer
          onTimerUpdate={handleTimerUpdate}
          onSessionSave={handleSessionSave}
        />
      </div>
    </div>
  );
}

export default Dashboard;
