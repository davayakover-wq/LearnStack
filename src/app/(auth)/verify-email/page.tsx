import type { Metadata } from 'next';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = { title: 'Verify your email — LearnStack' };

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <MailCheck className="text-primary size-8" />
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          We sent you a confirmation link. Click it to activate your account, then log in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center text-sm">
          Didn&apos;t get an email? Check your spam folder, or{' '}
          <Link href="/signup" className="text-foreground underline">
            try signing up again
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
