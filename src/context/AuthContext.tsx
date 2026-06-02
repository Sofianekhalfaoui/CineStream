import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<User>;
  signUp: (fullName: string, username: string, email: string | null, password: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null, 
  loading: true, 
  isAdmin: false,
  signIn: async () => { throw new Error('Not implemented'); },
  signUp: async () => { throw new Error('Not implemented'); }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isSigningUpRef = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        let userSnap = await getDoc(userRef);
        
        if (!userSnap.exists() && !isSigningUpRef.current) {
          // Generate a consistent 10-digit numeric ID from UID
          const numericHash = Math.abs(currentUser.uid.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0)).toString().padEnd(10, '0').substring(0, 10);

          const newData: any = {
            uid: currentUser.uid,
            accountNumber: numericHash,
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            createdAt: new Date().toISOString()
          };

          // Try to find if they have a username mapping
          try {
            // This is just a backup for Google users or if signUp fails middle-way
            if (currentUser.email && !currentUser.email.endsWith('@cinestream.internal')) {
              const defaultUsername = currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
              newData.username = defaultUsername;
            }
          } catch (e) {
            console.error("Error setting default username", e);
          }

          await setDoc(userRef, newData);
          setUserData(newData);
        } else {
          const data = userSnap.data();
          if (!data.accountNumber) {
            const numericHash = Math.abs(currentUser.uid.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0)).toString().padEnd(10, '0').substring(0, 10);
            await updateDoc(userRef, { accountNumber: numericHash });
            setUserData({ ...data, accountNumber: numericHash });
          } else {
            setUserData(data);
          }
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (fullName: string, username: string, email: string | null, password: string) => {
    isSigningUpRef.current = true;
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const lowerUsername = username.toLowerCase().trim();
      
      // Check username
      const usernameRef = doc(db, 'usernames', lowerUsername);
      const usernameSnap = await getDoc(usernameRef);
      if (usernameSnap.exists()) {
        throw new Error('Username already taken');
      }

      const authEmail = (email && email.trim()) || `${lowerUsername}@cinestream.internal`;
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const authUser = userCredential.user;

      await updateProfile(authUser, { displayName: fullName });

      // Consistent account number generation
      const numericHash = Math.abs(authUser.uid.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)).toString().padEnd(10, '0').substring(0, 10);

      // Create user document first to avoid onAuthStateChanged racing without username
      const creationDate = new Date().toISOString();
      await setDoc(doc(db, 'users', authUser.uid), {
        uid: authUser.uid,
        accountNumber: numericHash,
        displayName: fullName,
        username: lowerUsername,
        email: authEmail,
        createdAt: creationDate
      });

      await setDoc(usernameRef, {
        uid: authUser.uid,
        email: authEmail,
        username: lowerUsername
      });

      return authUser;
    } finally {
      // Delay resetting the ref slightly to ensure onAuthStateChanged callback has time to run and see the ref as true
      setTimeout(() => {
        isSigningUpRef.current = false;
      }, 1000);
    }
  };

  const signIn = async (username: string, password: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const lowerUsername = username.toLowerCase().trim();
    
    const usernameRef = doc(db, 'usernames', lowerUsername);
    const usernameSnap = await getDoc(usernameRef);
    
    if (!usernameSnap.exists()) {
      throw new Error('Username not found');
    }

    const { email } = usernameSnap.data();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, signIn, signUp }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
