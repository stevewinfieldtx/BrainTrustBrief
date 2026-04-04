import { useState, useMemo } from 'react';
import { Search, Filter, Users, Brain, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import MemberCard from '../components/MemberCard';
import { MEMBERS, CATEGORIES } from '../data/members';

const ALL_CATEGORIES = ['ALL', ...Object.keys(CATEGORIES)];

export default function Roster({ selectedMembers, setSelectedMembers }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => {
      const matchesSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        m.tagline.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'ALL' || m.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [search, activeCategory]);

  const toggleMember = (member) => {
    const isSelected = selectedMembers.some((m) => m.id === member.id);
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      if (selectedMembers.length >= 12) {
        alert('Maximum 12 members per BrainTrust.');
        return;
      }
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-1">The Roster</h1>
          <p className="text-gray-400">Choose 3–12 minds for your BrainTrust. <span className="text-amber-400 font-semibold">{selectedMembers.length} selected.</span></p>
        </div>
        {selectedMembers.length >= 3 && (
          <Link
            to="/assemble"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 text-gray-900 font-black hover:bg-amber-300 transition shadow-lg flex-shrink-0"
          >
            <Brain className="w-5 h-5" />
            View BrainTrust ({selectedMembers.length})
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag, or style..."
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition text-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {ALL_CATEGORIES.map((cat) => {
            const info = cat === 'ALL' ? null : CATEGORIES[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-amber-400 text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {info && <span>{info.icon}</span>}
                {cat === 'ALL' ? 'All (62)' : info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-5">Showing {filtered.length} of {MEMBERS.length} members</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isSelected={selectedMembers.some((m) => m.id === member.id)}
            onToggle={toggleMember}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No members match your search.</p>
          <p className="text-sm mt-1">Try a different name or tag.</p>
        </div>
      )}
    </div>
  );
}
