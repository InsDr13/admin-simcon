
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { Auth as FirebaseAuth } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ADMIN_UID } from '@/config'; // Import ADMIN_UID

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean; // New: to indicate if the currentUser is the admin
  loading: boolean;
  firebaseAuth: FirebaseAuth;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // New state for admin status
  const [loading, setLoading] = useState(true);
  const [showPageLoadingSpinner, setShowPageLoadingSpinner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isAuthPage = path === '/login' || path === '/signup' || path === '/reset-password';
      
      if (loading && !isAuthPage) {
        setShowPageLoadingSpinner(true);
      } else {
        setShowPageLoadingSpinner(false);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(user ? user.uid === ADMIN_UID : false); // Set isAdmin based on ADMIN_UID
      setLoading(false);
      setShowPageLoadingSpinner(false);
    });

    return () => unsubscribe();
  }, [loading]);

  const value = {
    currentUser,
    isAdmin, // Provide isAdmin in context
    loading,
    firebaseAuth: auth,
  };

  if (showPageLoadingSpinner) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
