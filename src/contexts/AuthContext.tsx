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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
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
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithIdentifier = async (identifier: string, pass: string) => {
    let email = identifier;
    
    // If it doesn't look like an email, try lookup
    if (!identifier.includes('@')) {
      const indexDoc = await getDoc(doc(db, 'user_indices', identifier.toLowerCase()));
      if (indexDoc.exists()) {
        email = indexDoc.data().email;
      }
    }
    
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, name: string, username: string, phone: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    
    // Update firebase profile with name
    await updateProfile(firebaseUser, { displayName: name });
    
    const lowerUsername = username.toLowerCase();
    
    // Create profile
    const newProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: email,
      username: username,
      phone: phone,
      role: 'Sales User',
      name: name
    };
    
    // Save profile and indices for lookup
    await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
    
    // Index by username and phone if provided
    if (username) {
      await setDoc(doc(db, 'user_indices', lowerUsername), { email: email.toLowerCase(), type: 'username' });
    }
    if (phone) {
      await setDoc(doc(db, 'user_indices', phone), { email: email.toLowerCase(), type: 'phone' });
    }
    
    setProfile(newProfile);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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
