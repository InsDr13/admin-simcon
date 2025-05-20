
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Added signOut

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Label import removed as it's not directly used, FormLabel is used instead
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { AuthCard } from '@/components/auth/AuthCard';
import { LogIn, Mail, Lock } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ADMIN_UID } from '@/config'; // Import ADMIN_UID

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse e-mail invalide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit comporter au moins 6 caractères.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user.uid === ADMIN_UID) {
        toast({ title: 'Connexion réussie', description: 'Bienvenue, Admin !' });
        router.push('/dashboard');
      } else {
        // Not an admin user
        await signOut(auth); // Sign out the non-admin user
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'avez pas l\'autorisation d\'accéder à cette application.',
          variant: 'destructive',
        });
        form.reset(); // Reset form fields
      }
    } catch (error: any) {
      toast({
        title: 'Échec de la connexion',
        description: error.message || 'Une erreur inattendue s\'est produite.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Connexion Administrateur" description="Connectez-vous pour gérer Admin simcon.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="admin@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size={20} /> : <LogIn className="mr-2 h-5 w-5" />}
            Se connecter
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        <p>
          Seuls les administrateurs peuvent se connecter.
        </p>
         {/* Optionally hide or modify signup/reset links if they are not relevant for a single admin setup */}
        <p className="mt-2">
          <Link href="/reset-password"className="font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
         {/* You might want to remove the "Sign up" link if only one admin exists
         <p>
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
        */}
      </div>
    </AuthCard>
  );
}

    