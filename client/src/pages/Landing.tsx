import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, BrainCircuit, ShieldAlert, Sparkles, SlidersHorizontal, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

const features = [
  { icon: BrainCircuit, title: 'AI Command Center', desc: 'Portfolio-wide health, risk and success probability computed live from your data.' },
  { icon: ShieldAlert, title: 'Explainable Risk', desc: 'Every risk score broken down into weighted, transparent contributing factors.' },
  { icon: Sparkles, title: 'Resource Allocation', desc: 'Rank best-fit engineers by skill match, availability, capacity and performance.' },
  { icon: SlidersHorizontal, title: 'What-If Simulator', desc: 'Change budget, deadline or team size and see risk shift before you commit.' },
  { icon: BarChart3, title: 'Executive Analytics', desc: 'Interactive dashboards across projects, budgets, teams and departments.' },
  { icon: Activity, title: 'Live CRUD', desc: 'Create and edit projects, tasks and people — dashboards update instantly.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Activity size={18} />
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-white">RiskLens</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/register"><Button size="sm">Get started</Button></Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-brand-50 to-transparent dark:from-brand-950/20" />
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
              <Sparkles size={13} /> AI-driven project risk & resource intelligence
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Predict risk. Allocate resources.
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent"> Deliver on time.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-400">
              An enterprise decision-support platform that forecasts delays and budget overruns and recommends the right people for every project — with fully explainable logic.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/register"><Button size="lg">Start free <ArrowRight size={16} /></Button></Link>
              <Link to="/login"><Button variant="outline" size="lg">Live demo</Button></Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">Demo login: admin@demo.com / password123</p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40">
                <f.icon size={20} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400 dark:border-slate-800">
        RiskLens — M.Tech enterprise decision-support demo. Prediction engine is deterministic & explainable (not a trained ML model).
      </footer>
    </div>
  );
}
