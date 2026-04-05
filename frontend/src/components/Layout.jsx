import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Brain, Users, MessageSquare, Trophy, Lightbulb, X } from 'lucide-react';

const FILLOUT_FORM_ID = '51kACJFmacus';

function FeedbackModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="font-black text-white">Share Your Thoughts</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        <iframe
          src={`https://forms.fillout.com/t/${FILLOUT_FORM_ID}?embed=1`}
          style={{ width: '100%', height: '520px', border: 'none' }}
          title="Feedback Form"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const navItems = [
    { path: '/',        label: 'BrainTrust',  icon: Brain },
    { path: '/roster',  label: 'All Members', icon: Users },
    { path: '/arena',   label: 'Arena',       icon: MessageSquare },
    { path: '/bracket', label: 'Tournament',  icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* TOP NAV */}
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">BrainTrust</span>
                <span className="text-lg font-black tracking-tight text-amber-400">Brief</span>
              </div>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                      active
                        ? 'text-amber-400 bg-amber-400/10'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Floating Feedback Button */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-400/40 rounded-full text-xs font-bold shadow-xl transition-all hover:shadow-amber-400/10 group"
      >
        <Lightbulb className="w-3.5 h-3.5 group-hover:text-amber-400 transition-colors" />
        Suggestions?
      </button>

      {/* Feedback Modal */}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
