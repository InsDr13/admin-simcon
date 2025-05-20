
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <Image 
            src="https://firebasestorage.googleapis.com/v0/b/materialx-9be3b.appspot.com/o/icon.jpg?alt=media&token=ee6d043c-59e0-40e6-9c92-196aa485557e" 
            alt="Admin simcon Logo" 
            width={160} 
            height={80} 
            priority 
            data-ai-hint="company logo"
          />
        </div>
        <CardTitle className="text-3xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
