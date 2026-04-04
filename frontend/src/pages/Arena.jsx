import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Send, ArrowRight, AlertCircle, Loader2,
  ChevronDown, Sparkles, Users,
} from 'lucide-react';
import { CATEGORIES } from '../data/members';

// ─── OpenRouter config ────────────────────────────────────────────────────────
const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY   = import.meta.env.VITE_OPENROUTER_API_KEY  || '';
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL    || 'google/gemini-2.5-flash';

// ─── Question types ───────────────────────────────────────────────────────────
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

// ─── Build LLM prompts ────────────────────────────────────────────────────────
function buildPrompt(type, form, members) {
  const roster = members.map((m) =>
    `• ${m.name} (${CATEGORIES[m.category].label})\n  Superpower: ${m.debateSuperpower}\n  Signature Move: ${m.signatureMove}\n  Traits — Boldness: ${m.traits.boldness}/10, Analytical Depth: ${m.traits.analyticalDepth}/10, Emotional IQ: ${m.traits.emotionalIQ}/10, Contrarian: ${m.traits.contrarian}/10, Communication: ${m.traits.communicationPower}/10`
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

  const systemPrompt = `You are facilitating a BrainTrust debate. Your panel consists of legendary minds with distinct personalities and debate styles. Generate 8 high-quality, DISTINCT answers to the challenge — each genuinely different in framing, philosophy, or strategy. Channel the actual voices and signature moves of the specific panel members. Make answers actionable, specific, and bold — not generic platitudes.

Return ONLY valid JSON (no markdown fences):
{
  "answers": [
    {
      "id": 1,
      "title": "Short punchy title (5-8 words)",
      "perspective": "Which panel member(s) this most represents",
      "summary": "2-4 sentences of specific, actionable strategic advice",
      "keyMove": "The single most important action to take right now"
    }
  ]
}`;

  const userPrompt = `BRAINTRUST PANEL:\n${roster}\n\n${questionBlock}\n\nGenerate 8 distinct strategic answers. Each must represent a different angle — different member perspectives, different strategic lenses, different recommended approaches. Be specific, bold, and actionable.`;

  return { systemPrompt, userPrompt };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Arena({ selectedMembers }) {
  const [questionType, setQuestionType] = useState('sales');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const [salesForm, setSalesForm] = useState({
    solution: '', industry: '', customerSize: '', title: '', context: '',
  });
  const [genericForm, setGenericForm] = useState({ question: '', context: '' });

  const [submitted,  setSubmitted]  = useState(false);
  const [generating, setGenerating] = useState(false);
  const [answers,    setAnswers]    = useState([]);
  const [error,      setError]      = useState('');

  const hasEnoughMembers = selectedMembers.length >= 3;
  const activeType = QUESTION_TYPES.find((t) => t.id === questionType);

  const canSubmit = () => {
    if (generating) return false;
    if (questionType === 'sales') return salesForm.solution.trim().length > 0 || salesForm.industry.length > 0;
    return genericForm.question.trim().length > 5;
  };

  // ── LLM call ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit()) return;
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
          max_tokens: 4096,
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
      setAnswers(parsed.answers || []);
      setSubmitted(true);
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
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!hasEnoughMembers) {
    return (
      <div className="text-white max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
        <h1 className="text-3xl font-black mb-3">BrainTrust Not Ready</h1>
        <p className="text-gray-400 mb-6">You need at least 3 members assembled before entering the Arena.</p>
        <Link
          to="/assemble"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-2xl hover:bg-amber-300 transition"
        >
          <Brain className="w-5 h-5" /> Assemble Your BrainTrust
        </Link>
      </div>
    );
  }

  // ── Results view ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-white max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black mb-1">8 Answers Generated</h1>
            <p className="text-gray-400">Your BrainTrust has spoken. Ready for the tournament.</p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-800 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition text-sm flex-shrink-0"
          >
            ← New Question
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          {selectedMembers.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 text-sm">
              <span>{m.avatar}</span>
              <span className="text-gray-300 font-semibold">{m.name}</span>
              <span className="text-gray-600">·</span>
            </span>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          {answers.map((a) => (
            <div key={a.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-lg font-black text-gray-900 flex-shrink-0 shadow">
                  {a.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                    <h3 className="font-black text-white text-base leading-tight">{a.title}</h3>
                    <span className="text-xs text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      {a.perspective}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">{a.summary}</p>
                  {a.keyMove && (
                    <div className="flex items-start gap-2 bg-gray-800 rounded-xl px-3 py-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-400 leading-relaxed">
                        <span className="text-amber-400 font-bold">Key Move: </span>{a.keyMove}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/bracket"
          className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-gray-900 font-black text-lg rounded-2xl hover:bg-amber-300 transition shadow-lg"
        >
          Start the Tournament <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  // ── Question form ─────────────────────────────────────────────────────────
  return (
    <div className="text-white max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-1">The Arena</h1>
        <p className="text-gray-400">Give your BrainTrust the question. They'll debate and generate 8 distinct answers.</p>
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

      {/* Question type dropdown */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Question Type
        </label>
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="w-full flex items-center justify-between gap-3 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-2xl px-5 py-4 text-left transition"
          >
            <div>
              <p className="font-bold text-white text-base">{activeType.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{activeType.description}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${showTypeMenu ? 'rotate-180' : ''}`} />
          </button>

          {showTypeMenu && (
            <div className="absolute z-20 mt-2 w-full bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setQuestionType(t.id); setShowTypeMenu(false); }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition hover:bg-gray-800 ${questionType === t.id ? 'bg-gray-800' : ''}`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </div>
                  {questionType === t.id && <span className="text-amber-400 text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sales Form ── */}
      {questionType === 'sales' && (
        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 space-y-5 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sales Situation Details</p>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              What is your solution / product? <span className="text-amber-400">*</span>
            </label>
            <input
              value={salesForm.solution}
              onChange={(e) => setSalesForm({ ...salesForm, solution: e.target.value })}
              placeholder="e.g. AI-powered revenue intelligence platform, enterprise HR software…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              What industry are you selling into?
            </label>
            <select
              value={salesForm.industry}
              onChange={(e) => setSalesForm({ ...salesForm, industry: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition text-sm"
            >
              <option value="">Select an industry…</option>
              {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              What size of customer?
            </label>
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSalesForm({ ...salesForm, customerSize: sz === salesForm.customerSize ? '' : sz })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    salesForm.customerSize === sz
                      ? 'bg-amber-400 text-gray-900 border-amber-400'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Who are you talking to? (title / role)
            </label>
            <input
              value={salesForm.title}
              onChange={(e) => setSalesForm({ ...salesForm, title: e.target.value })}
              placeholder="e.g. VP of Sales, CTO, CFO, Head of People…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Anything else we should know?{' '}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={salesForm.context}
              onChange={(e) => setSalesForm({ ...salesForm, context: e.target.value })}
              placeholder="e.g. They already use a competitor, deal size ~$200K, they've been ghosting us for 2 weeks…"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition text-sm resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Generic Form ── */}
      {questionType !== 'sales' && (
        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 space-y-5 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Your Question <span className="text-amber-400">*</span>
            </label>
            <textarea
              value={genericForm.question}
              onChange={(e) => setGenericForm({ ...genericForm, question: e.target.value })}
              placeholder={
                questionType === 'strategy' ? 'e.g. Should we expand internationally before dominating the US market?' :
                questionType === 'finance'  ? 'e.g. We have $500K left in runway — cut burn or raise now?' :
                questionType === 'product'  ? 'e.g. Should we build a freemium tier or stay fully paid?' :
                'Ask your BrainTrust anything…'
              }
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Context <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={genericForm.context}
              onChange={(e) => setGenericForm({ ...genericForm, context: e.target.value })}
              placeholder="Stage of company, constraints, relevant background…"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition text-sm resize-none"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit()}
        className="w-full inline-flex items-center justify-center gap-3 py-4 bg-amber-400 text-gray-900 font-black text-lg rounded-2xl hover:bg-amber-300 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {generating ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> BrainTrust is debating…</>
        ) : (
          <><Send className="w-5 h-5" /> Submit to BrainTrust</>
        )}
      </button>

      {generating && (
        <p className="mt-4 text-center text-sm text-gray-500 animate-pulse">
          {selectedMembers.map((m) => m.name).join(', ')} are in the room…
        </p>
      )}
    </div>
  );
}
