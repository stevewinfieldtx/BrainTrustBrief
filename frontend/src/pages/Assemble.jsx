import { Link } from 'react-router-dom';
import { Users, Trash2, ArrowRight, Plus, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '../data/members';

export default function Assemble({ selectedMembers, setSelectedMembers }) {
  const remove = (id) => setSelectedMembers(selectedMembers.filter((m) => m.id !== id));

  const categoryGroups = selectedMembers.reduce((acc, m) => {
    acc[m.category] = acc[m.category] || [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="text-white max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-1">Your BrainTrust</h1>
        <p className="text-gray-400">
          {selectedMembers.length === 0
            ? 'No members selected yet.'
            : `${selectedMembers.length} legendary mind${selectedMembers.length !== 1 ? 's' : ''} assembled.`}
        </p>
      </div>

      {selectedMembers.length === 0 ? (
        <div className="text-center py-24 bg-gray-900 rounded-3xl border border-gray-800">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <h2 className="text-2xl font-bold mb-2 text-gray-300">No one assembled yet</h2>
          <p className="text-gray-500 mb-6">Head to the Roster and add at least 3 minds to your BrainTrust.</p>
          <Link
            to="/roster"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-2xl hover:bg-amber-300 transition"
          >
            <Plus className="w-5 h-5" /> Browse the Roster
          </Link>
        </div>
      ) : (
        <>
          {/* Warning if fewer than 3 */}
          {selectedMembers.length < 3 && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 mb-6">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">Add at least <strong>3 members</strong> before entering the Arena.</p>
            </div>
          )}

          {/* Members by Category */}
          {Object.entries(categoryGroups).map(([cat, members]) => {
            const info = CATEGORIES[cat];
            return (
              <div key={cat} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-bold text-gray-300 text-sm uppercase tracking-wider">{info.label}</span>
                  <span className="text-xs text-gray-600 font-medium">({members.length})</span>
                </div>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-4 bg-gray-900 rounded-2xl px-4 py-3 border border-gray-800 hover:border-gray-700 transition"
                    >
                      <span className="text-2xl">{m.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.tagline}</p>
                      </div>
                      <div className="flex-shrink-0 flex flex-wrap gap-1 max-w-xs hidden md:flex">
                        {m.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">#{tag}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => remove(m.id)}
                        className="ml-2 p-2 text-gray-600 hover:text-red-400 transition rounded-lg hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-800">
            <Link
              to="/roster"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-700 transition"
            >
              <Plus className="w-4 h-4" /> Add More Members
            </Link>
            {selectedMembers.length >= 3 && (
              <Link
                to="/arena"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-2xl hover:bg-amber-300 transition shadow-lg"
              >
                Enter the Arena <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={() => setSelectedMembers([])}
              className="inline-flex items-center gap-2 px-5 py-3 bg-red-500/10 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 transition border border-red-500/20 ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Disband
            </button>
          </div>
        </>
      )}
    </div>
  );
}
