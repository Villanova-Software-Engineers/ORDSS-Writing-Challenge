import React, { useState } from 'react';
import { AuthService } from '../services/auth.service';

export const linkClass = 'text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const ResendVerificationLink: React.FC<{ email: string; password: string; className?: string }> = ({ email, password, className = '' }) => {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  const resend = async () => {
    setIsResending(true);
    try {
      setMessage((await AuthService.resendVerificationEmail({ email, password })).message);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <button type="button" onClick={resend} disabled={isResending} className={`${linkClass} ${className}`}>
        {isResending ? 'Sending…' : 'Resend verification email'}
      </button>
      {message && <span className="block text-sm text-text">{message}</span>}
    </>
  );
};

export default ResendVerificationLink;
