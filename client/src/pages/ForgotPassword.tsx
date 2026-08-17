import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-800 dark:bg-slate-900"
      >
        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              <MailCheck size={22} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-800 dark:text-white">Check your email</h1>
            <p className="mt-2 text-sm text-slate-500">
              If an account exists for {email}, we've sent a reset link.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Reset password</h1>
            <p className="mt-1 text-sm text-slate-500">We'll email you a reset link.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setSent(true); }}
              className="mt-6 space-y-4"
            >
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Send reset link</Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              <Link to="/login" className="font-medium text-brand-600 hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
