import { Link } from 'react-router-dom';
import { Brain, Users, MessageSquare, Trophy, ArrowRight, Zap, Target, Star } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Assemble Your BrainTrust',
    description: 'Pick 3–12 legendary minds from our roster of 62 — business titans, historical leaders, philosophers, scientists, fictional legends, and comedians.',
    icon: Users,
    color: 'from-amber-500 to-yellow-400',
    link: '/roster',
    cta: 'Browse Roster',
  },
  {
    number: '02',
    title: 'Submit Your Question',
    description: 'Give your BrainTrust the question, idea, problem, or pitch. They analyze it together, debate internally, and each generate a distinct answer.',
    icon: MessageSquare,
    color: 'from-violet-600 to-purple-500',
    link: '/arena',
    cta: 'Enter the Arena',
  },
  {
    number: '03',
    title: 'Round Robin Tournament',
    description: '8 answers generated. Then a round-robin: every answer faces every other answer. The BrainTrust votes — no ties. Top 4 advance.',
    icon: Zap,
    color: 'from-blue-600 to-cyan-500',
    link: '/bracket',
    cta: 'See Bracket',
  },
  {
    number: '04',
    title: 'Playoffs & Finals',
    description: '#1 vs #4, #2 vs #3 in best-of-5. Winners clash in a best-of-7 championship. Between games, the BrainTrust refines and sharpens the pitch.',
    icon: Trophy,
    color: 'from-rose-600 to-red-500',
    link: '/bracket',
    cta: 'View Results',
  },
];

const STATS = [
  { value: '62', label: 'Legendary Minds' },
  { value: '8', label: 'Answers Generated' },
  { value: '28', label: 'Round Robin Battles' },
  { value: '1', label: 'Champion Emerges' },
];

export default function Dashboard() {
  return (
    <div className="text-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative text-center py-20 mb-16 overflow-hidden rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)' }}>
        {/* Decorative glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-semibold mb-6">
            <Star className="w-4 h-4" />
            62 Legendary Minds. Infinite Debate.
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4">
            <span className="text-white">Brain</span>
            <span className="text-amber-400">Trust</span>
            <span className="text-white"> Brief</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-medium">
            Assemble a council of history's greatest minds. Give them your toughest question.
            Watch them debate, refine, and battle to find <em className="text-white not-italic font-bold">the best possible answer</em>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/roster"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-400 text-gray-900 font-black text-lg hover:bg-amber-300 transition shadow-xl shadow-amber-500/20"
            >
              <Brain className="w-5 h-5" /> Assemble Your BrainTrust
            </Link>
            <Link
              to="/arena"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gray-800 text-white font-bold text-lg hover:bg-gray-700 transition border border-gray-700"
            >
              Enter the Arena <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-800">
            <div className="text-4xl font-black text-amber-400 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-3xl font-black text-center mb-2">How It Works</h2>
        <p className="text-gray-400 text-center mb-10">Four stages. One winning idea.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-600 transition group">
                {/* Number + Icon */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-5xl font-black text-gray-800 group-hover:text-gray-700 transition">
                    {step.number}
                  </span>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{step.description}</p>
                <Link
                  to={step.link}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 transition"
                >
                  {step.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CATEGORY LEGEND ──────────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 mb-8">
        <h2 className="text-2xl font-black mb-2">The Roster</h2>
        <p className="text-gray-400 mb-6">62 minds across 6 categories. Each brings something the others don't.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { emoji: '💼', label: 'Business Titans',    count: 10, color: 'bg-amber-500' },
            { emoji: '⚔️',  label: 'Historical Leaders', count: 10, color: 'bg-red-600' },
            { emoji: '🧠', label: 'Philosophers',        count: 10, color: 'bg-violet-600' },
            { emoji: '🔬', label: 'Scientists',          count: 5,  color: 'bg-cyan-600' },
            { emoji: '🎭', label: 'Fictional Legends',   count: 15, color: 'bg-blue-700' },
            { emoji: '🎤', label: 'Comedians',           count: 12, color: 'bg-orange-600' },
          ].map((cat) => (
            <div key={cat.label} className="bg-gray-800/50 rounded-2xl p-4 text-center border border-gray-700">
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="text-2xl font-black text-white mb-1">{cat.count}</div>
              <div className="text-xs text-gray-400 font-medium">{cat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
