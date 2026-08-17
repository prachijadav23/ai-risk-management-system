import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/lib/api';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast('success', 'Welcome back!');
      navigate('/app');
    } catch (err) {
      toast('error', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Activity size={18} />
          </div>
          <span className="text-lg font-bold">RiskLens</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Ship projects with foresight, not hindsight.</h2>
          <p className="mt-4 max-w-md text-brand-100">
            Live risk prediction, explainable factors and smart resource allocation — in one enterprise workspace.
          </p>
        </div>
        <p className="text-xs text-brand-200">© {new Date().getFullYear()} RiskLens · Decision Support Platform</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your credentials to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">Sign in</Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account? <Link to="/register" className="font-medium text-brand-600 hover:underline">Create one</Link>
          </p>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Demo: <b>admin@demo.com</b> / <b>password123</b>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
