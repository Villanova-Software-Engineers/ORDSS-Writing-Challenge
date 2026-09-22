import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, authReady } from '../../firebase/config';
import { clearUserLocalStorage } from '../../services/apiClient';
import type {
  SignInRequest,
  SignUpRequest,
  AuthResponse,
  User,
} from '../types/auth.types';

// Error code thrown by signIn when the account exists but the email is unverified.
// UI code should check this instead of matching on the message text.
export const EMAIL_NOT_VERIFIED = 'auth/email-not-verified';

const VERIFY_EMAIL_SETTINGS = () => ({
  url: window.location.origin + '/auth/verify-email',
  handleCodeInApp: false,
});

function emailNotVerifiedError(): Error {
  const error = new Error('Please verify your email before signing in. Check your inbox for the verification link.');
  (error as Error & { code: string }).code = EMAIL_NOT_VERIFIED;
  return error;
}

// Turn Firebase's error codes into something a user can act on.
function friendlyResendError(error: unknown): Error {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/too-many-requests') {
    return new Error('Too many attempts. Please wait a few minutes before requesting another email.');
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return new Error('Invalid email or password.');
  }
  if (error instanceof Error) return error;
  return new Error('Failed to resend verification email. Please try again.');
}

export class AuthService {
  private static buildFallbackUser(firebaseUser: FirebaseUser): User {
    const displayNameParts = (firebaseUser.displayName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = displayNameParts[0] || 'Villanova';
    const lastName = displayNameParts.slice(1).join(' ') || 'Writer';

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      firstName,
      lastName,
      firebase_uid: firebaseUser.uid,
      isAdmin: false,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(),
    };
  }

  // Sign in with email and password
  static async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    await authReady;
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Check if email is verified (already available from signIn, no reload needed)
    if (!firebaseUser.emailVerified) {
      await firebaseSignOut(auth);
      throw emailNotVerifiedError();
    }

    // Keep the Firestore flag in step with Firebase Auth. Not awaited: sign-in must not block on it.
    setDoc(doc(db, 'users', firebaseUser.uid), { emailVerified: true }, { merge: true }).catch(() => {});

    // Start profile fetch but don't block sign-in on it
    const profilePromise = this.getUserProfile(firebaseUser.uid).catch((error) => {
      console.warn('[AuthService] Firestore profile read failed during sign-in, using fallback profile:', error);
      return null;
    });

    // Race: use profile if it resolves quickly, otherwise use fallback
    let userProfile: User | null = null;
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    userProfile = await Promise.race([profilePromise, timeout]);

    if (!userProfile) {
      userProfile = this.buildFallbackUser(firebaseUser);
      // Use fallback profile from Firebase Auth data
      // The backend will handle syncing complete profile data from PostgreSQL
      profilePromise.then((profile) => {
        if (!profile) {
          console.debug('[AuthService] Firestore profile not available, using Firebase Auth data. Backend will sync from PostgreSQL.');
        }
      });
    }

    return {
      success: true,
      user: userProfile,
    };
  }

  // Sign up - POST /users
  static async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    await authReady;
    const { email, password, firstName, lastName } = userData;

    // Create Firebase auth user — this is the critical step.
    // Once this succeeds the account exists and we can show success immediately.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const user: Omit<User, 'createdAt'> = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      firstName,
      lastName,
      firebase_uid: firebaseUser.uid,
      isAdmin: false,
      emailVerified: false,
    };

    // Require verification email send to succeed before returning success to UI.
    await sendEmailVerification(firebaseUser, VERIFY_EMAIL_SETTINGS());

    // IMPORTANT: Wait for profile creation to complete before signing out
    // This ensures the profile exists in Firestore before the user can sign in
    try {
      await Promise.all([
        updateProfile(firebaseUser, { displayName: `${firstName} ${lastName}` }),
        this.createUserProfile(user),
      ]);
    } catch (error) {
      // Still continue with signup even if Firestore fails
      // Backend will handle profile creation from Firebase Auth data
    }

    // Sign out the user after profile creation to enforce email verification
    await firebaseSignOut(auth);

    return {
      success: true,
      user: { ...user, createdAt: new Date() },
      message: 'Account created and verification email sent. Please check your inbox (and spam folder).',
    };
  }

  // Create user profile in Firestore
  private static async createUserProfile(user: Omit<User, 'createdAt'>): Promise<void> {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      createdAt: new Date(),
    });
  }

  // Get user profile from Firestore
  static async getUserProfile(userId: string): Promise<User | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data();
    return {
      id: userSnap.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      firebase_uid: data.firebase_uid,
      isAdmin: data.isAdmin || false,
      emailVerified: data.emailVerified || false,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  }

  // Resend verification email.
  //
  // Unverified users are never left signed in (signUp and signIn both sign them out),
  // so there is normally no auth.currentUser to send from. Pass the user's credentials
  // and this will sign in, send the email, and sign straight back out. Without
  // credentials it falls back to whoever is currently signed in.
  static async resendVerificationEmail(
    credentials?: SignInRequest,
  ): Promise<{ success: boolean; message: string }> {
    await authReady;

    let firebaseUser: FirebaseUser | null = auth.currentUser;
    let signedInHere = false;

    if (credentials) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        firebaseUser = userCredential.user;
        signedInHere = true;
      } catch (error) {
        throw friendlyResendError(error);
      }
    }

    if (!firebaseUser) {
      throw new Error('Enter your email and password so we know where to send the verification link.');
    }

    try {
      if (firebaseUser.emailVerified) {
        return {
          success: false,
          message: 'Your email is already verified. You can sign in.',
        };
      }

      await sendEmailVerification(firebaseUser, VERIFY_EMAIL_SETTINGS());

      return {
        success: true,
        message: 'Verification email sent! Please check your inbox and spam folder.',
      };
    } catch (error) {
      throw friendlyResendError(error);
    } finally {
      // Never leave an unverified session behind; that is what the rest of the app assumes.
      if (signedInHere) {
        await firebaseSignOut(auth).catch(() => {});
      }
    }
  }

  // Check and update email verification status
  static async checkEmailVerification(): Promise<boolean> {
    await authReady;
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return false;
    }

    //Reload user to get latest verification status
    await firebaseUser.reload();
    
    // Update Firestore if verification status changed
    if (firebaseUser.emailVerified) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, { emailVerified: true }, { merge: true });
    }

    return firebaseUser.emailVerified;
  }

  // Sign out
  static async signOut(): Promise<void> {
    await authReady;

    // Clear all user-specific localStorage data to prevent data leakage between accounts
    clearUserLocalStorage();

    await firebaseSignOut(auth);
  }

  // Send password reset email
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await authReady;
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    };
  }

  // Get current Firebase user
  static getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Subscribe to auth state changes
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}
