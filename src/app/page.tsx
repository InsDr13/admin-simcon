
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { signOut } from 'firebase/auth';      // Import signOut
import { auth } from '@/lib/firebase';        // Import auth instance

export default function HomePage() {
  const { currentUser, isAdmin, loading } = useAuth(); // isAdmin is now available
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    if (!loading) {
      if (currentUser && isAdmin) {
        // User is logged in AND is an admin
        router.replace('/dashboard');
      } else if (currentUser && !isAdmin) {
        // User is logged in BUT NOT an admin
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'avez pas l\'autorisation d\'accéder à cette application.',
          variant: 'destructive',
        });
        signOut(auth).then(() => { // Sign out the non-admin user
          router.replace('/login');
        }).catch(error => {
          console.error("Error signing out non-admin user:", error);
          router.replace('/login'); // Still redirect to login on error
        });
      } else {
        // No user logged in
        router.replace('/login');
      }
    }
  }, [currentUser, isAdmin, loading, router, toast]);

  // Show loading spinner while auth state is being determined,
  // or if a non-admin is being signed out.
  if (loading || (currentUser && !isAdmin)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }
  
  // Fallback, should ideally be covered by useEffect redirects
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LoadingSpinner size={48} />
    </div>
  );
}
