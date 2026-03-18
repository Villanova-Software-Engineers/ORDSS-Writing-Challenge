function Leaderboard() {
  const mockData = [
    { rank: 1, name: "Jane D.", totalTime: 54000, streak: 12, activeDays: 14 },
    { rank: 2, name: "John S.", totalTime: 48600, streak: 10, activeDays: 13 },
    { rank: 3, name: "Sarah M.", totalTime: 43200, streak: 9, activeDays: 12 },
    { rank: 4, name: "You", totalTime: 36000, streak: 5, activeDays: 10 },
    { rank: 5, name: "Alex K.", totalTime: 32400, streak: 7, activeDays: 9 },
  ];

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-text mb-8">Leaderboard</h1>

      <div className="bg-background rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-accent/20">
              <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-8 py-4">
                Rank
              </th>
              <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-8 py-4">
                Name
              </th>
              <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-8 py-4">
                Total Time
              </th>
              <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-8 py-4">
                Streak
              </th>
              <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-8 py-4">
                Active Days
              </th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((entry) => (
              <tr
                key={entry.rank}
                className={`border-b border-accent/10 ${
                  entry.name === "You" ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-8 py-4">
                  <span
                    className={`text-base font-bold ${
                      entry.rank <= 3 ? "text-primary" : "text-muted"
                    }`}
                  >
                    #{entry.rank}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span
                    className={`text-base font-medium ${
                      entry.name === "You"
                        ? "text-primary font-bold"
                        : "text-text"
                    }`}
                  >
                    {entry.name}
                  </span>
                </td>
                <td className="px-8 py-4 text-base text-text font-mono">
                  {formatTime(entry.totalTime)}
                </td>
                <td className="px-8 py-4 text-base text-text">
                  {entry.streak} days
                </td>
                <td className="px-8 py-4 text-base text-text">
                  {entry.activeDays}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted mt-6">
        Leaderboard data is per semester. Rankings update after each saved
        session.
      </p>
    </div>
  );
}

export default Leaderboard;
