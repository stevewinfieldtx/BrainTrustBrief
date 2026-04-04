import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight, Trash2, ChevronDown, Check, Users, Zap } from 'lucide-react';
import { MEMBERS, CATEGORIES } from '../data/members';

// ─── Seat Roles ──────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'visionary',   label: 'The Visionary',    icon: '🔭', color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'strategist',  label: 'The Strategist',   icon: '♟️', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30' },
  { id: 'devil',       label: "Devil's Advocate", icon: '😈', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
  { id: 'analyst',     label: 'The Analyst',      icon: '📊', color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { id: 'empath',      label: 'The Empath',       icon: '💛', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { id: 'executor',    label: 'The Executor',     icon: '⚡', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30' },
  { id: 'wildcard',    label: 'The Wild Card',    icon: '🃏', color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/30' },
  { id: 'philosopher', label: 'The Philosopher',  icon: '🧠', color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30' },
  { id: 'closer',      label: 'The Closer',       icon: '🎯', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
];

// ─── Category gradient map ────────────────────────────────────────────────────
const CAT_GRADIENT = {
  BUSINESS:    'from-amber-600 to-yellow-500',
  HISTORICAL:  'from-red-800 to-rose-600',
  PHILOSOPHER: 'from-violet-700 to-purple-500',
  SCIENTIST:   'from-cyan-700 to-teal-500',
  FICTIONAL:   'from-blue-800 to-indigo-600',
  COMEDIAN:    'from-orange-600 to-amber-400',
};

const SIZE_OPTIONS = [3, 5, 7, 9];

// ─── Compute seat positions around a circle ───────────────────────────────────
function getSeatPositions(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const radius = 38;
    return {
      top:  50 + radius * Math.sin(angle),
      left: 50 + radius * Math.cos(angle),
    };
  });
}

// ─── Compact member row inside the panel ─────────────────────────────────────
function MemberRow({ member, onSelect }) {
  const cat = CATEGORIES[member.category];
  return (
    <button
      onClick={() => onSelect(member)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition group text-left"
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CAT_GRADIENT[member.category]} flex items-center justify-center text-xl flex-shrink-0 shadow`}
      >
        {member.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm leading-tight truncate">{member.name}</p>
        <p className="text-xs text-gray-500 truncate">{cat.icon} {cat.label}</p>
      </div>
      <Check className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Assemble({ selectedMembers, setSelectedMembers }) {
  const [trustSize, setTrustSize]         = useState(null);   // 3 | 5 | 7 | 9
  const [seats, setSeats]                 = useState({});     // { idx: { member, role } }
  const [activeSeat, setActiveSeat]       = useState(null);   // seat panel open
  const [rolePickerSeat, setRolePickerSeat] = useState(null); // role picker seat
  const [search, setSearch]               = useState('');
  const [filterCat, setFilterCat]         = useState('ALL');

  // IDs already placed
  const assignedIds = useMemo(
    () => new Set(Object.values(seats).map((s) => s.member?.id).filter(Boolean)),
    [seats]
  );

  // Members available (unassigned, matching filters)
  const availableMembers = useMemo(() => {
    return MEMBERS.filter((m) => {
      if (assignedIds.has(m.id)) return false;
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.tagline.toLowerCase().includes(search.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCat = filterCat === 'ALL' || m.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [assignedIds, search, filterCat]);

  const filledCount = trustSize
    ? Array.from({ length: trustSize }, (_, i) => seats[i]).filter((s) => s?.member).length
    : 0;

  const seatPositions = trustSize ? getSeatPositions(trustSize) : [];

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openSeatPanel = (idx) => {
    setActiveSeat(idx);
    setRolePickerSeat(null);
    setSearch('');
    setFilterCat('ALL');
  };

  const assignMember = (member) => {
    setSeats((prev) => ({ ...prev, [activeSeat]: { ...prev[activeSeat], member } }));
    setActiveSeat(null);
  };

  const removeSeat = (idx, e) => {
    e.stopPropagation();
    setSeats((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const assignRole = (seatIdx, role) => {
    setSeats((prev) => ({ ...prev, [seatIdx]: { ...prev[seatIdx], role } }));
    setRolePickerSeat(null);
  };

  const removeRole = (seatIdx) => {
    setSeats((prev) => {
      const next = { ...prev, [seatIdx]: { ...prev[seatIdx] } };
      delete next[seatIdx].role;
      return next;
    });
    setRolePickerSeat(null);
  };

  const changeSize = (size) => {
    setTrustSize(size);
    setSeats((prev) => {
      const next = {};
      for (let i = 0; i < size; i++) if (prev[i]) next[i] = prev[i];
      return next;
    });
    setActiveSeat(null);
    setRolePickerSeat(null);
  };

  const disbandAll = () => {
    setSeats({});
    setTrustSize(null);
    setActiveSeat(null);
    setRolePickerSeat(null);
  };

  const sendToArena = () => {
    const members = Array.from({ length: trustSize }, (_, i) => seats[i]?.member).filter(Boolean);
    setSelectedMembers(members);
  };

  // ── Size Picker ───────────────────────────────────────────────────────────
  if (!trustSize) {
    return (
      <div className="text-white max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2">Assemble Your BrainTrust</h1>
          <p className="text-gray-400 text-lg">
            Choose the size of your council. Each seat will hold one legendary mind.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => changeSize(size)}
              className="relative group rounded-3xl border-2 border-gray-700 hover:border-amber-400 bg-gray-900 p-8 text-left transition-all duration-200 hover:bg-gray-800 hover:shadow-xl hover:shadow-amber-500/10"
            >
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {Array.from({ length: size }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-gray-700 group-hover:bg-amber-500/40 transition-all duration-300"
                    style={{ transitionDelay: `${i * 30}ms` }}
                  />
                ))}
              </div>
              <p className="text-5xl font-black text-white mb-1">{size}</p>
              <p className="text-sm text-gray-400 font-semibold uppercase tracking-widest">
                {size === 3 ? 'Core Council' :
                 size === 5 ? 'Inner Circle' :
                 size === 7 ? 'Full Council' :
                              'Grand Assembly'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {size === 3 ? 'Tight, decisive, fast' :
                 size === 5 ? 'Balanced and versatile' :
                 size === 7 ? 'Deep coverage, rich debate' :
                              'Maximum cognitive diversity'}
              </p>
              <ArrowRight className="absolute top-4 right-4 w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Round Table View ──────────────────────────────────────────────────────
  return (
    <div className="text-white">
      {/* Header bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">Your BrainTrust</h1>
          <p className="text-gray-400">
            {filledCount}/{trustSize} seats filled
            {filledCount > 0 && ' · Click a seat to assign or swap'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Size switcher */}
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => changeSize(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  trustSize === s ? 'bg-amber-400 text-gray-900' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {filledCount >= 3 && (
            <Link
              to="/arena"
              onClick={sendToArena}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition shadow-lg"
            >
              Enter the Arena <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={disbandAll}
            className="p-2 text-gray-600 hover:text-red-400 transition rounded-lg hover:bg-red-400/10"
            title="Disband"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── Left: Round Table + Seat List ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Round table */}
          <div className="relative mx-auto" style={{ width: '100%', paddingBottom: '100%', maxWidth: 500 }}>
            {/* Table surface */}
            <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-2xl flex flex-col items-center justify-center pointer-events-none">
              <Users className="w-8 h-8 text-gray-700 mb-1" />
              <p className="text-gray-700 text-xs font-bold uppercase tracking-widest">BrainTrust</p>
              <p className="text-gray-600 text-xs mt-1">{filledCount}/{trustSize}</p>
            </div>

            {/* Seats */}
            {seatPositions.map((pos, idx) => {
              const seat     = seats[idx];
              const member   = seat?.member;
              const role     = seat?.role;
              const isActive = activeSeat === idx;

              return (
                <div
                  key={idx}
                  className="absolute"
                  style={{ top: `${pos.top}%`, left: `${pos.left}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <button
                    onClick={() => openSeatPanel(idx)}
                    className={`relative flex flex-col items-center gap-1 group transition-all duration-200 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                    style={{ width: 80 }}
                  >
                    {/* Avatar circle */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 transition-all duration-200 ${
                        member
                          ? `bg-gradient-to-br ${CAT_GRADIENT[member.category]} border-transparent shadow-lg`
                          : isActive
                          ? 'bg-amber-500/20 border-amber-400 border-dashed'
                          : 'bg-gray-800 border-gray-700 border-dashed group-hover:border-amber-500/50 group-hover:bg-gray-700'
                      }`}
                    >
                      {member
                        ? <span>{member.avatar}</span>
                        : <span className={`text-base font-black ${isActive ? 'text-amber-400' : 'text-gray-600 group-hover:text-gray-400'}`}>{idx + 1}</span>
                      }
                    </div>

                    {/* Label below seat */}
                    <div className="text-center" style={{ width: 88, marginLeft: -4 }}>
                      {member ? (
                        <>
                          <p className="text-xs font-bold text-white leading-tight truncate">{member.name}</p>
                          {role
                            ? <p className={`text-[10px] font-semibold ${role.color} truncate`}>{role.icon} {role.label}</p>
                            : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setRolePickerSeat(idx); setActiveSeat(null); }}
                                className="text-[10px] text-gray-600 hover:text-amber-400 transition"
                              >
                                + set role
                              </button>
                            )
                          }
                        </>
                      ) : (
                        <p className="text-[10px] text-gray-600 group-hover:text-gray-400 transition">
                          {isActive ? 'Selecting…' : 'Empty seat'}
                        </p>
                      )}
                    </div>

                    {/* Remove ✕ */}
                    {member && !isActive && (
                      <button
                        onClick={(e) => removeSeat(idx, e)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Seat list (compact rows) */}
          <div className="mt-4 space-y-2 max-w-lg mx-auto">
            {Array.from({ length: trustSize }, (_, idx) => {
              const seat   = seats[idx];
              const member = seat?.member;
              const role   = seat?.role;
              return (
                <div
                  key={idx}
                  onClick={() => openSeatPanel(idx)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 border transition-all cursor-pointer select-none ${
                    activeSeat === idx
                      ? 'border-amber-400/50 bg-amber-500/5'
                      : member
                      ? 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                    member
                      ? `bg-gradient-to-br ${CAT_GRADIENT[member.category]}`
                      : 'bg-gray-800 border border-dashed border-gray-700'
                  }`}>
                    {member ? member.avatar : <span className="text-xs text-gray-600">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {member
                      ? <>
                          <p className="text-sm font-bold text-white leading-tight">{member.name}</p>
                          <p className="text-xs text-gray-500">{CATEGORIES[member.category].icon} {CATEGORIES[member.category].label}</p>
                        </>
                      : <p className="text-sm text-gray-600">Seat {idx + 1} — empty</p>
                    }
                  </div>
                  {role && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${role.bg} ${role.color} hidden sm:inline-flex items-center gap-1`}>
                      {role.icon} {role.label}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${activeSeat === idx ? 'rotate-180 text-amber-400' : 'text-gray-700'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Member Browser Panel ──────────────────────────────── */}
        {activeSeat !== null && (
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-4 bg-gray-900 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
              {/* Panel header */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-white">Assign to Seat {activeSeat + 1}</p>
                  <button
                    onClick={() => setActiveSeat(null)}
                    className="p-1.5 text-gray-500 hover:text-white transition rounded-lg hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search minds…"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                    autoFocus
                  />
                </div>
                {/* Category filter pills */}
                <div className="flex gap-1 flex-wrap">
                  {[{ key: 'ALL', icon: '⭐' },
                    ...Object.entries(CATEGORIES).map(([key, val]) => ({ key, icon: val.icon }))
                  ].map(({ key, icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilterCat(key)}
                      className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                        filterCat === key ? 'bg-amber-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable member list */}
              <div className="overflow-y-auto p-2" style={{ maxHeight: 420 }}>
                {availableMembers.length === 0
                  ? <p className="text-center text-sm text-gray-600 py-8">No matches</p>
                  : availableMembers.map((m) => (
                      <MemberRow key={m.id} member={m} onSelect={assignMember} />
                    ))
                }
              </div>

              <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
                <p className="text-xs text-gray-600">{availableMembers.length} available · {assignedIds.size} seated</p>
                <Link
                  to="/roster"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition"
                >
                  Browse all →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Right: Role Picker Panel ──────────────────────────────────── */}
        {rolePickerSeat !== null && activeSeat === null && (
          <div className="w-72 flex-shrink-0">
            <div className="sticky top-4 bg-gray-900 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
              <div className="px-4 pt-4 pb-3 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <p className="font-black text-white">Assign Role</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {seats[rolePickerSeat]?.member?.name} · Seat {rolePickerSeat + 1}
                  </p>
                </div>
                <button
                  onClick={() => setRolePickerSeat(null)}
                  className="p-1.5 text-gray-500 hover:text-white transition rounded-lg hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                {ROLES.map((role) => {
                  const isCurrent = seats[rolePickerSeat]?.role?.id === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => assignRole(rolePickerSeat, role)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isCurrent ? `${role.bg} border` : 'hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">{role.icon}</span>
                      <span className={`text-sm font-bold ${isCurrent ? role.color : 'text-gray-300'}`}>
                        {role.label}
                      </span>
                      {isCurrent && <Check className={`w-4 h-4 ml-auto ${role.color}`} />}
                    </button>
                  );
                })}
                {seats[rolePickerSeat]?.role && (
                  <button
                    onClick={() => removeRole(rolePickerSeat)}
                    className="w-full text-center text-xs text-red-400 hover:text-red-300 mt-2 py-2 transition"
                  >
                    Remove role
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {filledCount >= 3 && (
        <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <p className="text-gray-300 font-semibold">
              <span className="text-amber-400 font-black">{filledCount} minds</span> ready for battle
            </p>
          </div>
          <Link
            to="/arena"
            onClick={sendToArena}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-2xl hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
          >
            Enter the Arena <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
