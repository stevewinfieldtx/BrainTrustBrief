import { Outlet, Link, useLocation } from 'react-router-dom';
import { Brain, Users, MessageSquare, Trophy } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

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
    </div>
  );
}
