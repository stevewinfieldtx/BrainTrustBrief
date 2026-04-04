import { useState } from 'react';
import { Check, Plus, ChevronDown, ChevronUp, Quote, Zap, Target } from 'lucide-react';
import { CATEGORIES } from '../data/members';

const TRAIT_LABELS = {
  boldness: 'Boldness',
  analyticalDepth: 'Analytical Depth',
  emotionalIQ: 'Emotional IQ',
  contrarian: 'Contrarian Index',
  communicationPower: 'Communication Power',
};

const TRAIT_COLORS = {
  boldness: 'bg-red-500',
  analyticalDepth: 'bg-blue-600',
  emotionalIQ: 'bg-pink-500',
  contrarian: 'bg-violet-600',
  communicationPower: 'bg-amber-500',
};

function TraitBar({ label, value, colorClass }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-xs font-bold text-gray-700">{value}/10</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

export default function MemberCard({ member, isSelected, onToggle, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[member.category];

  const gradientStyle = {
    background: `linear-gradient(135deg, ${
      member.category === 'BUSINESS'    ? '#d97706, #f59e0b' :
      member.category === 'HISTORICAL'  ? '#991b1b, #dc2626' :
      member.category === 'PHILOSOPHER' ? '#5b21b6, #7c3aed' :
      member.category === 'SCIENTIST'   ? '#0e7490, #06b6d4' :
      member.category === 'FICTIONAL'   ? '#1e3a8a, #2563eb' :
                                          '#c2410c, #f97316'
    })`,
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white shadow-sm hover:shadow-xl group
        ${isSelected
          ? 'border-emerald-500 shadow-emerald-100 shadow-lg ring-2 ring-emerald-300'
          : 'border-gray-100 hover:border-gray-300'
        }`}
    >
      {/* ── TOP BANNER ───────────────────────────────────────────────────── */}
      <div className="relative h-24 flex items-end px-4 pb-3" style={gradientStyle}>
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 0px, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Avatar circle */}
        <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-3xl shadow-lg">
          {member.avatar}
        </div>

        {/* Category badge */}
        <div className="relative z-10 ml-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold">
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </span>
        </div>

        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-md z-20">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* ── CARD BODY ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-4">

        {/* Name + Era */}
        <div className="mb-1">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{member.name}</h3>
          <p className="text-xs text-gray-400 font-medium">{member.era} · {member.origin}</p>
        </div>

        {/* Tagline */}
        <p className="text-xs font-semibold text-gray-500 italic mb-3 leading-snug">
          "{member.tagline}"
        </p>

        {/* Quote */}
        <div className="mb-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
          <Quote className="w-3 h-3 text-gray-300 mb-1" />
          <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-2">
            {member.quote}
          </p>
        </div>

        {/* Debate Superpower */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Debate Superpower</span>
          </div>
          <p className={`text-xs text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {member.debateSuperpower}
          </p>
        </div>

        {/* Signature Move */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Signature Move</span>
          </div>
          <p className={`text-xs text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {member.signatureMove}
          </p>
        </div>

        {/* Expandable: Traits + Tags */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Trait Profile</p>
            {Object.entries(member.traits).map(([key, val]) => (
              <TraitBar
                key={key}
                label={TRAIT_LABELS[key] || key}
                value={val}
                colorClass={TRAIT_COLORS[key] || 'bg-gray-400'}
              />
            ))}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {member.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 mt-2 text-xs text-gray-400 hover:text-gray-600 transition py-1"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Traits &amp; tags</>
          )}
        </button>

        {/* Select button */}
        <button
          onClick={() => onToggle(member)}
          className={`w-full mt-2 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200
            ${isSelected
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100'
              : 'bg-gray-900 text-white hover:bg-gray-700 group-hover:bg-gray-800'
            }`}
        >
          {isSelected ? (
            <><Check className="w-4 h-4" strokeWidth={3} /> On Your BrainTrust</>
          ) : (
            <><Plus className="w-4 h-4" /> Add to BrainTrust</>
          )}
        </button>
      </div>
    </div>
  );
}
