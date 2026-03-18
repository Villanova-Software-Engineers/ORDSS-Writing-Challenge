function MessageBoard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-text mb-8">Message Board</h1>

      <div className="bg-background rounded-xl shadow p-8">
        <div className="border-2 border-dashed border-accent/30 rounded-xl p-16 text-center">
          <svg
            className="w-16 h-16 mx-auto text-accent/50 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-text mb-3">
            Coming Soon
          </h2>
          <p className="text-base text-muted max-w-lg mx-auto">
            Post and view messages from your semester cohort. The message board
            will be available once the backend API is connected.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MessageBoard;
