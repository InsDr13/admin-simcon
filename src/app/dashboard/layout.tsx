
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/dashboard/Navbar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
// ADMIN_UID import not directly needed here as useAuth provides isAdmin

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isAdmin, loading } = useAuth(); // useAuth now provides isAdmin
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If not loading and (no current user OR current user is not admin)
      if (!currentUser || !isAdmin) {
        router.replace('/login');
      }
    }
  }, [currentUser, isAdmin, loading, router]);

  // If loading, or no current user, or current user is not admin
  if (loading || !currentUser || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  // Only render dashboard if user is loaded, present, and is an admin
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
         {children}
        </div>
      </main>
       <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Admin simcon. Tous droits réservés.
      </footer>
    </div>
  );
}

    