import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithIdentifier: (identifier: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, username: string, phone: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        try {
          const profileDoc = await getDocFromServer(doc(db, 'users', firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            // Default to Sales User if no profile exists
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'Sales User',
              name: firebaseUser.displayName || 'Anonymous'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          // If server fetch fails, try local cache
          try {
            const cachedDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (cachedDoc.exists()) {
              setProfile(cachedDoc.data() as UserProfile);
              return;
            }
          } catch (e) {
            // silent fail for cache
          }
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
  };

  const signInWithIdentifier = async (identifier: string, pass: string) => {
    const emailInput = identifier.trim();
    let finalEmail = emailInput;
    
    // If it doesn't look like an email, try lookup
    if (!emailInput.includes('@')) {
      const cleanIdentifier = emailInput.toLowerCase().replace(/\s/g, ''); 
      const path = `user_indices/${cleanIdentifier}`;
      try {
        const indexDoc = await getDocFromServer(doc(db, 'user_indices', cleanIdentifier));
        if (indexDoc.exists()) {
          finalEmail = indexDoc.data().email;
        } else {
          throw new Error('Identity not recognized: Please check your username or mobile number.');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Identity not recognized')) {
          throw error;
        }
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
    
    await signInWithEmailAndPassword(auth, finalEmail.toLowerCase(), pass);
  };

  const signUp = async (email: string, pass: string, name: string, username: string, phone: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, ''); // Digits only for index
    
    // 1. Check availability
    if (cleanUsername) {
      const usernamePath = `user_indices/${cleanUsername}`;
      try {
        const usernameDoc = await getDocFromServer(doc(db, 'user_indices', cleanUsername)).catch(() => null);
        if (usernameDoc?.exists()) {
          throw new Error('Alias already claimed by another node.');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('claimed')) throw error;
        handleFirestoreError(error, OperationType.GET, usernamePath);
      }
    }

    if (cleanPhone) {
      const phonePath = `user_indices/${cleanPhone}`;
      try {
        const phoneDoc = await getDocFromServer(doc(db, 'user_indices', cleanPhone)).catch(() => null);
        if (phoneDoc?.exists()) {
          throw new Error('Signal (mobile) already registered.');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('registered')) throw error;
        handleFirestoreError(error, OperationType.GET, phonePath);
      }
    }

    // 2. Auth Creation
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const firebaseUser = userCredential.user;
    
    // Update firebase profile with name
    await updateProfile(firebaseUser, { displayName: name });
    
    // 3. Atomic Data Creation
    const batch = writeBatch(db);
    const profilePath = `users/${firebaseUser.uid}`;
    
    const newProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: cleanEmail,
      username: cleanUsername,
      phone: phone.trim(),
      role: 'Sales User',
      name: name.trim()
    };
    
    batch.set(doc(db, 'users', firebaseUser.uid), newProfile);
    
    if (cleanUsername) {
      batch.set(doc(db, 'user_indices', cleanUsername), { uid: firebaseUser.uid, email: cleanEmail, type: 'username' });
    }
    if (cleanPhone) {
      batch.set(doc(db, 'user_indices', cleanPhone), { uid: firebaseUser.uid, email: cleanEmail, type: 'phone' });
    }

    try {
      await batch.commit();
      setProfile(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithEmail, signInWithIdentifier, signUp, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
