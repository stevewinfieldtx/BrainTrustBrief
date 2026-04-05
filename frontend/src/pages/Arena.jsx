import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Send, ArrowRight, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Sparkles, Users, Shield, Zap, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { CATEGORIES } from '../data/members';

// ─── OpenRouter config ─────────────────────────────────────────────────────────
const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY   = import.meta.env.VITE_OPENROUTER_API_KEY  || '';
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL    || 'google/gemini-2.5-flash';

// ─── Question types ────────────────────────────────────────────────────────────
const QUESTION_TYPES = [
  { id: 'sales',    label: '💼 Sales',    description: 'Get strategic advice for a specific sales situation' },
  { id: 'strategy', label: '♟️ Strategy', description: 'Debate a strategic business decision' },
  { id: 'finance',  label: '📊 Finance',  description: 'Evaluate a financial move or challenge' },
  { id: 'product',  label: '🔧 Product',  description: 'Decide on a product direction or feature' },
  { id: 'custom',   label: '✍️ Custom',   description: 'Ask anything — open-ended question' },
];

const INDUSTRIES = [
  'SaaS / Software', 'Financial Services', 'Healthcare & Life Sciences',
  'Manufacturing', 'Retail & E-commerce', 'Real Estate', 'Media & Entertainment',
  'Professional Services', 'Government / Public Sector', 'Education',
  'Energy & Utilities', 'Logistics & Supply Chain', 'Other',
];

const COMPANY_SIZES = [
  'Startup / Pre-revenue', 'SMB (1–99)', 'Mid-Market (100–999)',
  'Enterprise (1K–9.9K)', 'Large Enterprise (10K+)',
];

// ─── Build LLM prompts ─────────────────────────────────────────────────────────
function buildPrompt(type, form, members) {
  const roster = members.map((m) =>
    `• ${m.name} (${CATEGORIES[m.category].label})\n  Superpower: ${m.debateSuperpower}\n  Signature Move: ${m.signatureMove}\n  Traits — Boldness: ${m.traits.boldness}/10, Analytical: ${m.traits.analyticalDepth}/10, Emotional IQ: ${m.traits.emotionalIQ}/10, Contrarian: ${m.traits.contrarian}/10`
  ).join('\n\n');

  let questionBlock = '';
  if (type === 'sales') {
    questionBlock = [
      'SALES SITUATION:',
      `Solution / Product: ${form.solution || '(not specified)'}`,
      `Target Industry: ${form.industry || '(not specified)'}`,
      `Customer Size: ${form.customerSize || '(not specified)'}`,
      `Decision-Maker Title: ${form.title || '(not specified)'}`,
      `Additional Context: ${form.context || 'None'}`,
    ].join('\n');
  } else {
    questionBlock = `${type.toUpperCase()} QUESTION: ${form.question}\n\nContext: ${form.context || 'None provided.'}`;
  }

  const systemPrompt = `You are facilitating a BrainTrust debate. Generate 8 DISTINCT strategic answers — each a genuinely different approach. Channel the actual voices and personalities of the specific panel members. Be specific, bold, and actionable.

Return ONLY valid JSON (no markdown fences):
{
  "answers": [
    {
      "id": 1,
      "title": "Short punchy title (5-8 words)",
      "champion": "Single BrainTrust member name most likely to advocate this approach",
      "perspective": "1-2 sentence framing of the philosophical angle",
      "summary": "2-3 sentence overview of this strategy",
      "content": "4-6 sentences of detailed, specific, actionable advice — what exactly to do and how",
      "keyMove": "The single most important action to take right now (1 sentence)",
      "rationale": "Why the BrainTrust chose this — the core insight or contrarian belief that makes it compelling (2-3 sentences)",
      "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
      "weaknesses": ["honest weakness 1", "honest weakness 2"],
      "concerns": ["risk or concern 1", "risk or concern 2"]
    }
  ]
}`;

  const userPrompt = `BRAINTRUST PANEL:\n${roster}\n\n${questionBlock}\n\nGenerate 8 distinct strategic answers. Each must represent a genuinely different angle — different strategic philosophy, different risk profile, different implementation approach. Be specific and bold.`;

  return { systemPrompt, userPrompt };
}

// ─── StrategyCard ──────────────────────────────────────────────────────────────
function StrategyCard({ answer, index, isExpanded, onToggle }) {
  const rankColors = ['from-amber-500 to-yellow-400', 'from-blue-500 to-cyan-400', 'from-purple-500 to-violet-400',
    'from-green-500 to-emerald-400', 'from-red-500 to-pink-400', 'from-orange-500 to-amber-400',
    'from-teal-500 to-cyan-400', 'from-indigo-500 to-blue-400'];
  const gradient = rankColors[index % rankColors.length];

  return (
    <div className={`bg-gray-900 rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-amber-500/40 shadow-lg shadow-amber-500/10' : 'border-gray-800 hover:border-gray-700'}`}>
      {/* Header — always visible */}
      <button className="w-full text-left p-5" onClick={onToggle}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg font-black text-gray-900 flex-shrink-0 shadow`}>
            {answer.id}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
              <h3 className="font-black text-white text-base leading-tight">{answer.title}</h3>
              <span className="text-xs text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
                {answer.perspective || answer.champion}
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{answer.summary}</p>
            {answer.keyMove && !isExpanded && (
              <div className="flex items-start gap-2 bg-gray-800 rounded-xl px-3 py-2 mt-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="text-amber-400 font-bold">Key Move: </span>{answer.keyMove}
                </p>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 mt-1">
            {isExpanded
              ? <ChevronUp className="w-4 h-4 text-amber-400" />
              : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">

          {/* Full strategy content */}
          {answer.content && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> The Full Strategy
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{answer.content}</p>
            </div>
          )}

          {/* Key Move */}
          {answer.keyMove && (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Key Move
              </p>
              <p className="text-sm text-white font-semibold">{answer.keyMove}</p>
            </div>
          )}

          {/* Rationale — why the BrainTrust went with this */}
          {answer.rationale && (
            <div className="bg-blue-400/5 border border-blue-400/15 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Brain className="w-3 h-3" /> Why the BrainTrust Chose This
              </p>
              <p className="text-sm text-gray-300 leading-relaxed italic">"{answer.rationale}"</p>
              {answer.champion && (
                <p className="text-xs text-blue-400/70 mt-1.5">— Championed by {answer.champion}</p>
              )}
            </div>
          )}

          {/* Strengths / Weaknesses / Concerns — 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {answer.strengths?.length > 0 && (
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Strengths
                </p>
                <ul className="space-y-1.5">
                  {answer.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {answer.weaknesses?.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Weaknesses
                </p>
                <ul className="space-y-1.5">
                  {answer.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">−</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {answer.concerns?.length > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Concerns
                </p>
                <ul className="space-y-1.5">
                  {answer.concerns.map((c, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-yellow-400 mt-0.5 flex-shrink-0">!</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Arena({ selectedMembers }) {
  const [questionType, setQuestionType] = useState('sales');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const [salesForm, setSalesForm] = useState({
    solution: '', industry: '', customerSize: '', title: '', context: '',
  });
  const [genericForm, setGenericForm] = useState({ question: '', context: '' });

  const [submitted,   setSubmitted]   = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [answers,     setAnswers]     = useState([]);
  const [error,       setError]       = useState('');
  const [expandedId,  setExpandedId]  = useState(null);

  const hasEnoughMembers = selectedMembers.length >= 3;
  const activeType = QUESTION_TYPES.find((t) => t.id === questionType);

  const canSubmit = () => {
    if (generating) return false;
    if (questionType === 'sales') return salesForm.solution.trim().length > 0 || salesForm.industry.length > 0;
    return genericForm.question.trim().length > 5;
  };

  // ── LLM call ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit()) return;
    if (!OPENROUTER_KEY) {
      setError('OpenRouter API key is not configured. Set VITE_OPENROUTER_API_KEY in Railway environment variables.');
      return;
    }
    setGenerating(true);
    setError('');

    const form = questionType === 'sales' ? salesForm : genericForm;
    const { systemPrompt, userPrompt } = buildPrompt(questionType, form, selectedMembers);

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://braintrustbrief.local',
          'X-Title': 'BrainTrust Brief',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 6000,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      let raw = data.choices?.[0]?.message?.content || '';
      raw = raw.trim();
      if (raw.startsWith('```')) raw = raw.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();

      const parsed = JSON.parse(raw);
      const finalAnswers = parsed.answers || [];
      setAnswers(finalAnswers);
      setSubmitted(true);
      setExpandedId(null);

      // Persist so Tournament can use them
      const builtQ = questionType === 'sales'
        ? `Sales: ${salesForm.solution} → ${salesForm.industry} / ${salesForm.customerSize} / ${salesForm.title}`
        : genericForm.question;
      localStorage.setItem('btb_answers',  JSON.stringify(finalAnswers));
      localStorage.setItem('btb_question', builtQ);
      localStorage.setItem('btb_members',  JSON.stringify(selectedMembers));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Check the browser console.');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setAnswers([]);
    setError('');
    setExpandedId(null);
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!hasEnoughMembers) {
    return (
      <div className="text-white max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
        <h1 className="text-3xl font-black mb-3">BrainTrust Not Ready</h1>
        <p className="text-gray-400 mb-6">You need at least 3 members assembled before entering the Arena.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-2xl hover:bg-amber-300 transition">
          <Brain className="w-5 h-5" /> Assemble Your BrainTrust
        </Link>
      </div>
    );
  }

  // ── Results: strategy gallery ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-white max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black mb-1">8 Strategies — Full Transparency</h1>
            <p className="text-gray-400 text-sm">Click any strategy to see the BrainTrust's full reasoning — rationale, strengths, weaknesses, and concerns.</p>
          </div>
          <button onClick={handleReset}
            className="px-4 py-2 bg-gray-800 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition text-sm flex-shrink-0">
            ← New Question
          </button>
        </div>

        {/* BrainTrust panel */}
        <div className="flex flex-wrap gap-2 mb-5 bg-gray-900 rounded-2xl p-3 border border-gray-800 items-center">
          <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {selectedMembers.map((m) => (
            <span key={m.id} className="flex items-center gap-1 text-sm">
              <span>{m.avatar}</span>
              <span className="text-gray-300 font-semibold">{m.name}</span>
              <span className="text-gray-700">·</span>
            </span>
          ))}
        </div>

        {/* Expand all / collapse all */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">{answers.length} strategies generated · tap any card to expand</p>
          <div className="flex gap-2">
            <button onClick={() => setExpandedId('all')}
              className="text-xs px-3 py-1 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition border border-gray-700">
              Expand all
            </button>
            <button onClick={() => setExpandedId(null)}
              className="text-xs px-3 py-1 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition border border-gray-700">
              Collapse all
            </button>
          </div>
        </div>

        {/* Strategy cards */}
        <div className="space-y-3 mb-8">
          {answers.map((a, i) => (
            <StrategyCard
              key={a.id}
              answer={a}
              index={i}
              isExpanded={expandedId === 'all' || expandedId === a.id}
              onToggle={() => setExpandedId(prev =>
                prev === a.id ? null : a.id
              )}
            />
          ))}
        </div>

        <Link to="/bracket"
          className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-gray-900 font-black text-lg rounded-2xl hover:bg-amber-300 transition shadow-lg">
          Run the Tournament <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  // ── Question form ──────────────────────────────────────────────────────────
  return (
    <div className="text-white max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-1">The Arena</h1>
        <p className="text-gray-400">Give your BrainTrust the question. They'll generate 8 distinct strategies with full transparency.</p>
      </div>

      {/* Active BrainTrust */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6 flex flex-wrap gap-2 items-center">
        <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
        {selectedMembers.map((m) => {
          const cat = CATEGORIES[m.category];
          return (
            <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 rounded-lg text-sm border border-gray-700">
              <span>{m.avatar}</span>
              <span className="font-semibold text-white">{m.name}</span>
              <span className="text-gray-500 text-xs">{cat.icon}</span>
            </div>
          );
        })}
      </div>

      {/* Question type selector */}
      <div className="relative mb-6">
        <button
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm font-semibold hover:border-gray-600 transition w-full"
        >
          <span className="text-white">{activeType.label}</span>
          <span className="text-gray-500 flex-1 text-left text-xs">{activeType.description}</span>
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </button>
        {showTypeMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl">
            {QUESTION_TYPES.map((t) => (
              <button key={t.id} onClick={() => { setQuestionType(t.id); setShowTypeMenu(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-800 transition text-left ${t.id === questionType ? 'bg-gray-800' : ''}`}>
                <span className="font-semibold text-white">{t.label}</span>
                <span className="text-gray-500 text-xs">{t.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sales form */}
      {questionType === 'sales' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Solution / Product *</label>
            <input value={salesForm.solution} onChange={e => setSalesForm(f => ({ ...f, solution: e.target.value }))}
              placeholder="e.g. AI-powered contract review platform"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Target Industry</label>
              <select value={salesForm.industry} onChange={e => setSalesForm(f => ({ ...f, industry: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition">
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Customer Size</label>
              <select value={salesForm.customerSize} onChange={e => setSalesForm(f => ({ ...f, customerSize: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition">
                <option value="">Select size…</option>
                {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Decision-Maker Title</label>
            <input value={salesForm.title} onChange={e => setSalesForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. VP of Legal, Chief Procurement Officer"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Additional Context</label>
            <textarea value={salesForm.context} onChange={e => setSalesForm(f => ({ ...f, context: e.target.value }))}
              rows={3} placeholder="Current objections, competitive situation, deal stage, any important details…"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500 transition resize-none" />
          </div>
        </div>
      )}

      {/* Generic form */}
      {questionType !== 'sales' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Your Question *</label>
            <textarea value={genericForm.question} onChange={e => setGenericForm(f => ({ ...f, question: e.target.value }))}
              rows={3} placeholder="Ask the BrainTrust anything…"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500 transition resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Context (optional)</label>
            <textarea value={genericForm.context} onChange={e => setGenericForm(f => ({ ...f, context: e.target.value }))}
              rows={2} placeholder="Background, constraints, what you've already tried…"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500 transition resize-none" />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={!canSubmit()}
        className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-gray-900 font-black text-base rounded-2xl hover:bg-amber-300 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
        {generating
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Convening BrainTrust…</>
          : <><Send className="w-5 h-5" /> Generate 8 Strategies</>}
      </button>
    </div>
  );
}
