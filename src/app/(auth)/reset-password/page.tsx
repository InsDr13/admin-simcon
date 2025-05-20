
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Label is not directly used, FormLabel from form is.
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { AuthCard } from '@/components/auth/AuthCard';
import { KeyRound, Mail } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Adresse e-mail invalide.' }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({ title: 'Email de réinitialisation envoyé', description: 'Vérifiez votre boîte de réception pour les instructions.' });
      setEmailSent(true);
    } catch (error: any) {
      toast({
        title: 'Erreur lors de l\'envoi de l\'email',
        description: error.message || 'Impossible d\'envoyer l\'email de réinitialisation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthCard title="Vérifiez vos emails" description="Un lien de réinitialisation de mot de passe a été envoyé à votre adresse email.">
        <div className="text-center">
          <p className="mb-4">Si vous ne voyez pas l'email, vérifiez votre dossier spam.</p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Réinitialiser le mot de passe" description="Entrez votre email pour recevoir un lien de réinitialisation.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="vous@exemple.fr" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size={20} /> : <KeyRound className="mr-2 h-5 w-5" />}
            Envoyer le lien
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        Vous vous souvenez de votre mot de passe ?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </div>
    </AuthCard>
  );
}
