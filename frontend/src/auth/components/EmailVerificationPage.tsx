import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import ThemeToggle from './ThemeToggle';

const primaryButton =
  'w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none';
const secondaryButton =
  'w-full rounded-[14px] border border-accent/20 bg-text/5 px-3 py-3 text-sm font-semibold text-text transition-all hover:border-text/20 hover:bg-text/10 disabled:opacity-65 disabled:cursor-not-allowed';
const inputClass =
  'w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-background px-4 py-3 text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200';

// Two ways to arrive here:
//  1. Signed in but unverified (rare: the app signs unverified users out).
//  2. Signed out. This is the normal case, because the verification email's link
//     lands here after Firebase confirms the address. We must not bounce away.
const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Credentials for resending when there is no session to send from.
  const [resendEmail, setResendEmail] = useState('');
  const [resendPassword, setResendPassword] = useState('');

  useEffect(() => {
    // Take only the first auth event: that is the restored session (or none).
    // Later events come from our own resend sign-in/sign-out and must not flip the UI.
    let settled = false;
    const unsubscribe = AuthService.onAuthStateChanged((firebaseUser) => {
      if (settled) return;
      settled = true;
      setHasSession(!!firebaseUser);
      setUserEmail(firebaseUser?.email || '');
    });
    return unsubscribe;
  }, []);

  const isGood = isVerified || /sent|already verified/i.test(message);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setMessage('');

    try {
      const verified = await AuthService.checkEmailVerification();

      if (verified) {
        setIsVerified(true);
        setMessage('Email verified successfully! Redirecting to sign in...');

        setTimeout(async () => {
          await AuthService.signOut();
          navigate('/auth/sign-in');
        }, 1800);
      } else {
        setMessage('Not verified yet. Click the link in your inbox, then try again.');
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to check verification status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setMessage('');

    try {
      const response = hasSession
        ? await AuthService.resendVerificationEmail()
        : await AuthService.resendVerificationEmail({ email: resendEmail.trim(), password: resendPassword });
      setMessage(response.message);
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignIn = async () => {
    await AuthService.signOut();
    navigate('/auth/sign-in');
  };

  if (hasSession === null) return null;

  const subtitle = isVerified
    ? 'Your email is verified. Continue to sign in.'
    : hasSession
      ? `We sent a link to ${userEmail || 'your email address'}. Click it, then confirm below.`
      : 'If you just clicked the link in your email, your address is verified and you can sign in. Need the email again? Enter your details below.';

  return (
    <div className="flex min-h-screen items-center justify-center p-12 text-text tracking-tight max-lg:p-6">
      <ThemeToggle />
      <div className="w-full max-w-[560px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Email verification
          </span>
          <h2 className="mt-2.5 mb-1.5 text-[26px] font-bold">{isVerified ? 'All set!' : 'Check your inbox'}</h2>
          <p className="text-muted">{subtitle}</p>
        </div>

        {message && (
          <div className={`mb-3 rounded-[14px] border p-3 text-[13px] ${
            isGood
              ? 'border-green-400/30 bg-green-500/5 text-green-600'
              : 'border-red-400/30 bg-red-500/5 text-red-600'
          }`}>
            {message}
          </div>
        )}

        {isVerified ? (
          <button onClick={handleBackToSignIn} type="button" className={primaryButton}>
            Go to sign in
          </button>
        ) : hasSession ? (
          <div className="mt-1.5 flex flex-col gap-3.5">
            <button onClick={handleCheckVerification} disabled={isChecking} type="button" className={primaryButton}>
              {isChecking ? 'Checking…' : "I've verified my email"}
            </button>
            <button onClick={handleResendEmail} disabled={isResending} type="button" className={secondaryButton}>
              {isResending ? 'Sending…' : 'Resend verification email'}
            </button>
            <button onClick={handleBackToSignIn} type="button" className="border-none bg-transparent p-0 font-semibold text-primary cursor-pointer">
              &larr; Back to sign in
            </button>
          </div>
        ) : (
          <div className="mt-1.5 flex flex-col gap-3.5">
            <button onClick={() => navigate('/auth/sign-in')} type="button" className={primaryButton}>
              Go to sign in
            </button>
            <form
              onSubmit={(e) => { e.preventDefault(); handleResendEmail(); }}
              className="flex flex-col gap-3 rounded-[14px] border border-accent/20 p-4"
            >
              <p className="text-sm font-semibold">Didn&apos;t get the email?</p>
              <input
                id="resendEmail"
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={isResending}
                className={inputClass}
              />
              <input
                id="resendPassword"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={resendPassword}
                onChange={(e) => setResendPassword(e.target.value)}
                disabled={isResending}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={isResending || !resendEmail.trim() || !resendPassword}
                className={secondaryButton}
              >
                {isResending ? 'Sending…' : 'Resend verification email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
