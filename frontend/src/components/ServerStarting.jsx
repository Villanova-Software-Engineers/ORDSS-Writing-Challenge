import { useEffect, useState } from 'react';
import AuthHero from '../auth/components/AuthHero';

export default function ServerStarting({ onRetry }) {
  const [dots, setDots] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    const timeInterval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        if (newTime === 2) setStage(1);
        if (newTime === 5) setStage(2);
        if (newTime === 8) setStage(3);
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const stages = [
    { title: 'Initializing Server', description: 'Starting services...' },
    { title: 'Waking Up Server', description: 'Bringing systems online...' },
    { title: 'Loading Resources', description: 'Loading application data...' },
    { title: 'Connecting to Database', description: 'Syncing with database...' },
  ];

  const currentStage = stages[stage];

  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] text-text tracking-tight max-lg:grid-cols-1">
      <AuthHero />

      <section className="flex items-center justify-center p-12 max-lg:p-6">
        <div className="w-full max-w-md">
          <div className="mb-9">
            <h2 className="mb-2.5 text-4xl font-bold text-text">
              {currentStage.title}{dots}
            </h2>
            <p className="ml-1 text-base text-muted">
              {currentStage.description}
            </p>
          </div>

          {/* Simple spinner */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>

          {/* Progress bars */}
          <div className="mb-8">
            <div className="flex justify-between gap-2">
              {stages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                    idx < stage
                      ? 'bg-green-500'
                      : idx === stage
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Time Elapsed */}
          <div className="text-center text-sm text-muted mb-8">
            Elapsed: <span className="text-primary font-medium">{formatTime(timeElapsed)}</span>
          </div>

          {/* Progress Steps */}
          <div className="space-y-2.5 mb-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            {stages.map((s, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    idx < stage
                      ? 'bg-green-500'
                      : idx === stage
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <span
                  className={`text-sm ${
                    idx < stage
                      ? 'text-green-600 dark:text-green-400'
                      : idx === stage
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {/* Retry Button (shows after 30 seconds) */}
          {timeElapsed >= 30 && onRetry && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
              <p className="text-center text-sm text-muted">
                Taking longer than expected?
              </p>
              <button
                onClick={onRetry}
                className="w-full px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry Connection
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-xs text-blue-700 dark:text-blue-400 text-center leading-relaxed">
              <span className="font-semibold block mb-1">Why is this taking time?</span>
              To optimize costs, our server enters sleep mode during inactivity. First request typically takes 30-60 seconds to wake up.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
