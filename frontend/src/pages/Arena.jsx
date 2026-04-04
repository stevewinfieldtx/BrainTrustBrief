import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Send, Lightbulb, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../data/members';

const EXAMPLE_QUESTIONS = [
  "Should we launch our product in Europe before fully saturating the US market?",
  "We're losing top talent to competitors who pay more. How do we keep them?",
  "Our startup has $500K left in runway. Do we cut burn or raise now?",
  "Should we build a freemium tier or stay fully paid?",
  "How do we turn a product that sells itself into a brand people love?",
  "We have two potential pivots — which one should we bet the company on?",
];

export default function Arena({ selectedMembers }) {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState([]);

  const hasEnoughMembers = selectedMembers.length >= 3;

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setGenerating(true);

    // Simulate generation delay (will connect to backend)
    await new Promise((r) => setTimeout(r, 2000));

    // Placeholder answers — these will come from AI backend
    const generatedAnswers = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `Answer ${i + 1}`,
      summary: `[BrainTrust analysis answer #${i + 1} will be generated here by the AI engine based on your ${selectedMembers.length} selected members debating the question.]`,
      score: 0,
      wins: 0,
      losses: 0,
      rank: null,
    }));

    setAnswers(generatedAnswers);
    setGenerating(false);
    setSubmitted(true);
  };

  if (!hasEnoughMembers) {
    return (
      <div className="text-white max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
        <h1 className="text-3xl font-black mb-3">BrainTrust Not Ready</h1>
        <p className="text-gray-400 mb-6">You need at least 3 members assembled before entering the Arena.</p>
        <Link
          to="/roster"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-2xl hover:bg-amber-300 transition"
        >
          <Brain className="w-5 h-5" /> Assemble Your BrainTrust
        </Link>
      </div>
    );
  }

  return (
    <div className="text-white max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-1">The Arena</h1>
        <p className="text-gray-400">Give your BrainTrust the question. They'll debate it and generate 8 distinct answers.</p>
      </div>

      {/* Active BrainTrust summary */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-8">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Your BrainTrust</p>
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((m) => {
            const cat = CATEGORIES[m.category];
            return (
              <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-xl border border-gray-700 text-sm">
                <span>{m.avatar}</span>
                <span className="font-semibold text-white">{m.name}</span>
                <span className="text-gray-500">{cat.icon}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!submitted ? (
        <>
          {/* Question input */}
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 mb-6">
            <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
              Your Question or Challenge
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Should we launch in Europe before saturating the US market?"
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition text-base resize-none"
            />

            <label className="block text-sm font-bold text-gray-300 mb-3 mt-5 uppercase tracking-wider">
              Additional Context <span className="text-gray-600 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Company stage, industry, constraints, relevant background..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition text-sm resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={!question.trim() || generating}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 py-4 bg-amber-400 text-gray-900 font-black text-lg rounded-2xl hover:bg-amber-300 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> BrainTrust is debating...</>
              ) : (
                <><Send className="w-5 h-5" /> Submit to BrainTrust</>
              )}
            </button>
          </div>

          {/* Example questions */}
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Example Questions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-left px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-600 transition"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Results preview */
        <div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Question Submitted</p>
            <p className="text-white font-semibold text-lg">"{question}"</p>
          </div>

          <p className="text-sm font-bold text-gray-400 mb-4">8 Answers Generated. Ready for Tournament.</p>

          <div className="space-y-3 mb-8">
            {answers.map((a) => (
              <div key={a.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-lg font-black text-amber-400 flex-shrink-0">
                  {a.id}
                </div>
                <div>
                  <p className="font-bold text-white mb-1">{a.title}</p>
                  <p className="text-sm text-gray-500">{a.summary}</p>
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
      )}
    </div>
  );
}
