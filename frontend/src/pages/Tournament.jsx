import { useState, useEffect, useRef } from 'react';
import { Trophy, Swords, Star, Crown, FileText, ChevronRight, X, Zap, AlertTriangle, Shield, Brain, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── OpenRouter ────────────────────────────────────────────────────────────────
const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY   = import.meta.env.VITE_OPENROUTER_API_KEY  || '';
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL    || 'google/gemini-2.5-flash';

// ─── Shared AI helpers ─────────────────────────────────────────────────────────
function buildMatchups(answers) {
  const m = [];
  for (let i = 0; i < answers.length; i++)
    for (let j = i + 1; j < answers.length; j++)
      m.push({ aIdx: i, bIdx: j, result: null });
  return m;
}

function computeStandings(answers, matchups) {
  const scores = answers.map((a, i) => ({ idx: i, answer: a, wins: 0, losses: 0, record: [] }));
  matchups.forEach((m, mi) => {
    if (!m.result) return;
    const wi = m.result.winner === 'A' ? m.aIdx : m.bIdx;
    const li = m.result.winner === 'A' ? m.bIdx : m.aIdx;
    scores[wi].wins++;
    scores[wi].record.push({ matchIdx: mi, outcome: 'W', vs: li, margin: `${m.result.forWinner}–${9 - m.result.forWinner}`, reasoning: m.result.reasoning });
    scores[li].losses++;
    scores[li].record.push({ matchIdx: mi, outcome: 'L', vs: wi, margin: `${9 - m.result.forWinner}–${m.result.forWinner}`, reasoning: m.result.reasoning });
  });
  return scores.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
}

async function judgeMatchup(question, a, b) {
  const trimA = (a.content || a.summary || '').slice(0, 300);
  const trimB = (b.content || b.summary || '').slice(0, 300);
  const prompt = `Panel of 9 judges evaluating two strategies for: "${question}"

STRATEGY A: ${a.title}
${trimA}

STRATEGY B: ${b.title}
${trimB}

Vote on which strategy is stronger. Return ONLY JSON:
{"winner":"A","forWinner":6,"reasoning":"One decisive sentence on the key differentiator."}

forWinner = how many of 9 voted for the winner (5–9).`;

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
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  let raw = data.choices?.[0]?.message?.content?.trim() || '';
  if (raw.startsWith('```')) raw = raw.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(raw);
  return {
    winner: parsed.winner === 'B' ? 'B' : 'A',
    forWinner: Math.min(9, Math.max(5, Number(parsed.forWinner) || 6)),
    reasoning: parsed.reasoning || '',
  };
}

async function fetchMatchupLearning(question, matchLabel, a, b, result) {
  const winnerStrategy = result.winner === 'A' ? a : b;
  const loserStrategy  = result.winner === 'A' ? b : a;
  const votes          = result.forWinner;
  const closeness = votes === 5 ? 'razor-thin (5–4)' : votes === 6 ? 'narrow (6–3)' : votes === 7 ? 'clear (7–2)' : votes === 8 ? 'dominant (8–1)' : 'unanimous (9–0)';

  const prompt = `Tournament analyst reviewing ${matchLabel} for: "${question}"

Winner: "${winnerStrategy.title}" — ${votes} of 9 votes (${closeness})
Loser: "${loserStrategy.title}"
Judge reasoning: ${result.reasoning}

Winner strategy: ${(winnerStrategy.content || winnerStrategy.summary || '').slice(0, 250)}
Loser strategy: ${(loserStrategy.content || loserStrategy.summary || '').slice(0, 250)}

Give ONE sharp, specific learning from this matchup. What does this result reveal about what actually works in this context? Be concrete, not generic. Focus on the WHY — what principle does this matchup surface? 2-3 sentences max.`;

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
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75, max_tokens: 180,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No learning available.';
}

// ─── Battle Arena — live feed during round-robin ───────────────────────────────
function BattleArena({ matchups, answers, completedCount, total }) {
  const pending = matchups.filter(m => !m.result);
  const done    = matchups.filter(m => m.result);
  const recent  = done.slice(-5).reverse();

  return (
    <div className="bg-gray-900 border border-amber-500/40 rounded-2xl p-5 mb-5 shadow-lg shadow-amber-500/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">Battle Arena — Live</h3>
        <span className="ml-auto text-xs font-bold text-amber-400 tabular-nums bg-amber-400/10 px-2 py-0.5 rounded-full">
          {completedCount}/{total} decided
        </span>
      </div>

      {pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-orange-500" /> Currently Fighting
          </p>
          <div className="space-y-2">
            {pending.slice(0, 5).map((m, i) => (
              <div key={i}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-xl border border-amber-500/20 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}>
                <span className="text-xs text-white font-semibold truncate flex-1 text-right">{answers[m.aIdx]?.title}</span>
                <Swords className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-xs text-white font-semibold truncate flex-1">{answers[m.bIdx]?.title}</span>
              </div>
            ))}
            {pending.length > 5 && (
              <p className="text-xs text-gray-600 text-center py-1">+{pending.length - 5} more battles queued…</p>
            )}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-green-500" /> Latest Results
          </p>
          <div className="space-y-1.5">
            {recent.map((m, i) => {
              const winner = m.result.winner === 'A' ? answers[m.aIdx] : answers[m.bIdx];
              const loser  = m.result.winner === 'A' ? answers[m.bIdx] : answers[m.aIdx];
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/70 rounded-xl">
                  <span className="text-xs text-green-400 font-black flex-shrink-0">✓</span>
                  <span className="text-xs text-amber-300 font-semibold truncate flex-1">{winner?.title}</span>
                  <span className="text-xs text-gray-600 flex-shrink-0 font-mono">{m.result.forWinner}–{9 - m.result.forWinner}</span>
                  <span className="text-xs text-gray-600 flex-shrink-0">over</span>
                  <span className="text-xs text-gray-500 truncate flex-1 text-right">{loser?.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && done.length > 0 && (
        <p className="text-sm font-black text-green-400 text-center py-2">All battles complete! 🏆</p>
      )}
    </div>
  );
}

// ─── MatchCard — round-robin cards, clickable when done ───────────────────────
function MatchCard({ match, answers, matchIdx, onSelect, isDone }) {
  const [dotCount, setDotCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const prevResultRef = useRef(null);

  useEffect(() => {
    if (match.result && !prevResultRef.current) {
      prevResultRef.current = match.result;
      setDotCount(0);
      setRevealed(false);
      for (let d = 1; d <= 9; d++) setTimeout(() => setDotCount(d), d * 70);
      setTimeout(() => setRevealed(true), 9 * 70 + 300);
    } else if (match.result && prevResultRef.current) {
      setDotCount(9);
      setRevealed(true);
    }
  }, [match.result]);

  const a = answers[match.aIdx];
  const b = answers[match.bIdx];
  const result    = match.result;
  const winnerA   = revealed && result?.winner === 'A';
  const winnerB   = revealed && result?.winner === 'B';
  const isPending = !result;
  const isJudging = result && !revealed;
  const clickable = isDone && revealed;

  const dots = Array.from({ length: 9 }, (_, i) => {
    if (i >= dotCount) return <div key={i} className="w-2 h-2 rounded-full bg-gray-800" />;
    if (!revealed)     return <div key={i} className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />;
    const isWin = result.winner === 'A' ? i < result.forWinner : i >= (9 - result.forWinner);
    return <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${isWin ? 'bg-amber-400 scale-125' : 'bg-gray-600'}`} style={{ transitionDelay: `${i * 40}ms` }} />;
  });

  return (
    <div onClick={clickable ? () => onSelect(matchIdx) : undefined}
      className={`rounded-xl border p-3 transition-all duration-500
        ${clickable ? 'cursor-pointer hover:border-amber-400/50 hover:bg-gray-800 active:scale-[0.98]' : ''}
        ${winnerA || winnerB ? 'border-gray-700 bg-gray-900' :
          isJudging ? 'border-amber-500/50 bg-amber-500/5' :
          isPending ? 'border-gray-800 bg-gray-900/50' : 'border-gray-800 bg-gray-900'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600 font-mono">#{matchIdx + 1}</span>
        {isPending && <span className="text-xs text-gray-600">pending</span>}
        {isJudging && <span className="text-xs text-amber-400 font-bold animate-pulse">JUDGING</span>}
        {revealed && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-green-400 font-bold">
              {result.winner === 'A' ? a?.title?.split(' ').slice(0, 2).join(' ') : b?.title?.split(' ').slice(0, 2).join(' ')} wins
            </span>
            {clickable && <ChevronRight className="w-3 h-3 text-gray-600" />}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 mb-2">
        <div className={`flex-1 text-xs font-semibold truncate rounded px-1.5 py-0.5 ${winnerA ? 'text-amber-300 bg-amber-400/15' : revealed ? 'text-gray-600' : 'text-gray-400'}`}>{a?.title}</div>
        <span className="text-xs text-gray-700 flex-shrink-0">vs</span>
        <div className={`flex-1 text-xs font-semibold truncate rounded px-1.5 py-0.5 text-right ${winnerB ? 'text-amber-300 bg-amber-400/15' : revealed ? 'text-gray-600' : 'text-gray-400'}`}>{b?.title}</div>
      </div>
      <div className="flex gap-1 flex-wrap">{dots}</div>
      {revealed && result.reasoning && <p className="text-xs text-gray-500 italic mt-2 leading-relaxed">"{result.reasoning}"</p>}
      {clickable && <p className="text-xs text-gray-700 mt-2 text-right">tap for breakdown →</p>}
    </div>
  );
}

// ─── Bracket Match Card — bigger, for playoffs/finals ─────────────────────────
function BracketCard({ label, seedA, seedB, stratA, stratB, result, isRunning, isActive, onSelect }) {
  const [dotCount, setDotCount]   = useState(result ? 9 : 0);
  const [revealed, setRevealed]   = useState(!!result);
  const prevResultRef             = useRef(result);

  useEffect(() => {
    if (result && !prevResultRef.current) {
      prevResultRef.current = result;
      setDotCount(0); setRevealed(false);
      for (let d = 1; d <= 9; d++) setTimeout(() => setDotCount(d), d * 80);
      setTimeout(() => setRevealed(true), 9 * 80 + 400);
    }
  }, [result]);

  const winnerA   = revealed && result?.winner === 'A';
  const winnerB   = revealed && result?.winner === 'B';
  const isPending = !result && !isActive;
  const isJudging = isActive && !result;
  const clickable = revealed;

  const dots = Array.from({ length: 9 }, (_, i) => {
    if (i >= dotCount) return <div key={i} className="w-3 h-3 rounded-full bg-gray-800" />;
    if (!revealed)     return <div key={i} className="w-3 h-3 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />;
    const isWin = result.winner === 'A' ? i < result.forWinner : i >= (9 - result.forWinner);
    return <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${isWin ? 'bg-amber-400 scale-125' : 'bg-gray-600'}`} style={{ transitionDelay: `${i * 50}ms` }} />;
  });

  return (
    <div onClick={clickable && onSelect ? onSelect : undefined}
      className={`rounded-2xl border p-5 transition-all duration-500
        ${clickable && onSelect ? 'cursor-pointer hover:border-amber-400/50 hover:bg-gray-800 active:scale-[0.99]' : ''}
        ${isJudging ? 'border-amber-500/60 bg-amber-500/5 shadow-lg shadow-amber-500/10' :
          winnerA || winnerB ? 'border-gray-700 bg-gray-900' :
          isPending ? 'border-gray-800 bg-gray-900/40' : 'border-gray-800 bg-gray-900'}`}>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">{label}</p>
        {isJudging && <span className="text-xs text-amber-400 font-bold animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block animate-pulse" /> JUDGING</span>}
        {isPending && <span className="text-xs text-gray-600">Awaiting matchup</span>}
        {revealed && <span className="text-xs text-green-400 font-bold">{result.winner === 'A' ? stratA?.title?.split(' ').slice(0,3).join(' ') : stratB?.title?.split(' ').slice(0,3).join(' ')} advances</span>}
      </div>

      {/* Fighters */}
      <div className="space-y-3 mb-4">
        {[{ s: stratA, seed: seedA, isWinner: winnerA, isLoser: revealed && !winnerA },
          { s: stratB, seed: seedB, isWinner: winnerB, isLoser: revealed && !winnerB }].map(({ s, seed, isWinner, isLoser }, idx) => (
          <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isWinner ? 'bg-amber-400/15 border border-amber-400/30' : isLoser ? 'bg-gray-800/40 opacity-50' : 'bg-gray-800/60'}`}>
            <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isWinner ? 'bg-amber-400 text-gray-900' : 'bg-gray-700 text-gray-400'}`}>{seed}</span>
            <span className={`text-sm font-bold flex-1 ${isWinner ? 'text-white' : 'text-gray-400'}`}>{s?.title || '—'}</span>
            {isWinner && <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Judge dots */}
      <div className="flex gap-1.5 flex-wrap mb-3">{dots}</div>

      {/* Verdict */}
      {revealed && result.reasoning && (
        <div className="bg-gray-800 rounded-xl px-4 py-3 border-l-2 border-amber-400">
          <p className="text-xs text-gray-500 italic leading-relaxed">"{result.reasoning}"</p>
        </div>
      )}

      {clickable && onSelect && <p className="text-xs text-gray-600 mt-3 text-right">tap for full breakdown →</p>}
    </div>
  );
}

// ─── Live Scoreboard ───────────────────────────────────────────────────────────
function LiveScoreboard({ standings, completedCount, totalCount, onSelect }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sticky top-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Standings</p>
        <span className="text-xs text-amber-400 font-bold">{completedCount}/{totalCount}</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${(completedCount / Math.max(totalCount, 1)) * 100}%` }} />
      </div>
      <div className="space-y-1.5">
        {standings.map((s, i) => {
          const t = s.wins + s.losses;
          const pct = t > 0 ? Math.round((s.wins / t) * 100) : 0;
          return (
            <button key={s.idx} onClick={() => onSelect(i)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left hover:bg-gray-800 ${i < 4 ? 'opacity-100' : 'opacity-60'}`}>
              <span className={`text-xs font-black w-5 text-center flex-shrink-0 ${i === 0 ? 'text-amber-400' : 'text-gray-500'}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{s.answer.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1 bg-gray-700 rounded-full w-12 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums">{s.wins}W–{s.losses}L</span>
                </div>
              </div>
              {i < 4 && <span className="text-xs text-amber-400 flex-shrink-0">▲</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Matchup Drill-Down Modal (round-robin) ────────────────────────────────────
function MatchupDetail({ match, matchIdx, answers, question, onClose }) {
  const [learning, setLearning]         = useState('');
  const [loadingLearning, setLoading]   = useState(false);

  const a = answers[match.aIdx];
  const b = answers[match.bIdx];
  const result     = match.result;
  const winnerVotes = result?.forWinner || 0;
  const loserVotes  = 9 - winnerVotes;
  const closeness   = winnerVotes === 5 ? 'Razor-thin (5–4)' : winnerVotes === 6 ? 'Narrow (6–3)' : winnerVotes === 7 ? 'Clear win (7–2)' : winnerVotes === 8 ? 'Dominant (8–1)' : 'Unanimous (9–0)';

  useEffect(() => {
    if (result && OPENROUTER_KEY) {
      setLoading(true);
      fetchMatchupLearning(question, `Match #${matchIdx + 1}`, a, b, result)
        .then(setLearning).catch(() => setLearning('Could not load learning.'))
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Match #{matchIdx + 1} · Head-to-Head Breakdown</p>
            <h3 className="font-black text-white text-base leading-tight mt-0.5 truncate max-w-xs sm:max-w-md">{a?.title} <span className="text-gray-500 font-normal">vs</span> {b?.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition ml-3 flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* VS Banner */}
          <div className="flex items-stretch gap-3">
            {[{ s: a, isWinner: result?.winner === 'A' }, { s: b, isWinner: result?.winner === 'B' }].map(({ s, isWinner }, idx) => (
              <div key={idx} className={`flex-1 rounded-2xl p-4 ${idx === 1 ? 'text-right' : ''} ${isWinner ? 'bg-amber-400/10 border border-amber-400/40' : 'bg-gray-800/60 border border-gray-700'}`}>
                <p className={`text-xs font-bold mb-1 ${isWinner ? 'text-amber-400' : 'text-gray-500'}`}>{isWinner ? '🏆 WINNER' : 'Runner-up'}</p>
                <p className={`font-black text-sm leading-snug ${isWinner ? 'text-white' : 'text-gray-500'}`}>{s?.title}</p>
              </div>
            ))}
          </div>

          {/* Judge vote bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Judge Panel · 9 Votes</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${winnerVotes >= 8 ? 'bg-amber-400/20 text-amber-400' : winnerVotes >= 6 ? 'bg-gray-700 text-gray-300' : 'bg-red-500/10 text-red-400'}`}>{closeness}</span>
            </div>
            <div className="flex gap-1.5 mb-2">
              {Array.from({ length: 9 }, (_, i) => {
                const isWin = result?.winner === 'A' ? i < result.forWinner : i >= (9 - result.forWinner);
                return <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isWin ? 'bg-amber-400 text-gray-900' : 'bg-gray-800 text-gray-600'}`}>{i + 1}</div>;
              })}
            </div>
            <div className="flex justify-between text-xs">
              <span className={`font-semibold ${result?.winner === 'A' ? 'text-amber-400' : 'text-gray-500'}`}>{a?.title?.split(' ').slice(0,3).join(' ')}: {result?.winner === 'A' ? winnerVotes : loserVotes} votes</span>
              <span className={`font-semibold ${result?.winner === 'B' ? 'text-amber-400' : 'text-gray-500'}`}>{b?.title?.split(' ').slice(0,3).join(' ')}: {result?.winner === 'B' ? winnerVotes : loserVotes} votes</span>
            </div>
          </div>

          {result?.reasoning && (
            <div className="bg-gray-800 rounded-xl p-4 border-l-2 border-amber-400">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Judge Panel Verdict</p>
              <p className="text-sm text-gray-300 leading-relaxed italic">"{result.reasoning}"</p>
            </div>
          )}

          {/* Key Learning */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Brain className="w-3 h-3 text-blue-400" /> Key Learning from This Matchup</p>
            {loadingLearning && <div className="flex items-center gap-2 text-sm text-gray-500 italic bg-gray-800 rounded-xl p-4"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block flex-shrink-0" /> Extracting insight…</div>}
            {!loadingLearning && learning && <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-4"><p className="text-sm text-gray-300 leading-relaxed">{learning}</p></div>}
            {!loadingLearning && !learning && !OPENROUTER_KEY && <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-500 italic">API key not configured.</div>}
          </div>

          {/* Side-by-side summaries */}
          <div className="grid grid-cols-2 gap-3">
            {[{ s: a, isW: result?.winner === 'A', label: 'Strategy A' }, { s: b, isW: result?.winner === 'B', label: 'Strategy B' }].map(({ s, isW, label }) => (
              <div key={label}>
                <p className={`text-xs font-bold uppercase mb-2 ${isW ? 'text-amber-400' : 'text-gray-500'}`}>{label}{isW ? ' · 🏆' : ''}</p>
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-400 leading-relaxed">
                  {(s?.content || s?.summary || 'No details available.').slice(0, 220)}{(s?.content || s?.summary || '').length > 220 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bracket Drill-Down Modal (playoffs/finals) ────────────────────────────────
function BracketMatchupDetail({ label, stratA, stratB, seedA, seedB, result, question, onClose }) {
  const [learning, setLearning]       = useState('');
  const [loadingLearning, setLoading] = useState(false);

  const winnerVotes = result?.forWinner || 0;
  const loserVotes  = 9 - winnerVotes;
  const closeness   = winnerVotes === 5 ? 'Razor-thin (5–4)' : winnerVotes === 6 ? 'Narrow (6–3)' : winnerVotes === 7 ? 'Clear win (7–2)' : winnerVotes === 8 ? 'Dominant (8–1)' : 'Unanimous (9–0)';

  useEffect(() => {
    if (result && OPENROUTER_KEY) {
      setLoading(true);
      fetchMatchupLearning(question, label, stratA, stratB, result)
        .then(setLearning).catch(() => setLearning('Could not load learning.'))
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">{label} · Full Breakdown</p>
            <h3 className="font-black text-white text-base leading-tight mt-0.5">{stratA?.title} <span className="text-gray-500 font-normal">vs</span> {stratB?.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition ml-3 flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* VS Banner with seeds */}
          <div className="flex items-stretch gap-3">
            {[{ s: stratA, seed: seedA, isWinner: result?.winner === 'A' }, { s: stratB, seed: seedB, isWinner: result?.winner === 'B' }].map(({ s, seed, isWinner }, i) => (
              <div key={i} className={`flex-1 rounded-2xl p-4 ${i === 1 ? 'text-right' : ''} ${isWinner ? 'bg-amber-400/10 border border-amber-400/40' : 'bg-gray-800/60 border border-gray-700'}`}>
                <p className={`text-xs font-bold mb-1 ${isWinner ? 'text-amber-400' : 'text-gray-500'}`}>
                  {isWinner ? '🏆 WINNER' : 'Eliminated'} · Seed {seed}
                </p>
                <p className={`font-black text-sm leading-snug ${isWinner ? 'text-white' : 'text-gray-500'}`}>{s?.title}</p>
              </div>
            ))}
          </div>

          {/* Judge votes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Judge Panel · 9 Votes</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${winnerVotes >= 8 ? 'bg-amber-400/20 text-amber-400' : winnerVotes >= 6 ? 'bg-gray-700 text-gray-300' : 'bg-red-500/10 text-red-400'}`}>{closeness}</span>
            </div>
            <div className="flex gap-1.5 mb-2">
              {Array.from({ length: 9 }, (_, i) => {
                const isWin = result?.winner === 'A' ? i < result.forWinner : i >= (9 - result.forWinner);
                return <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isWin ? 'bg-amber-400 text-gray-900' : 'bg-gray-800 text-gray-600'}`}>{i + 1}</div>;
              })}
            </div>
            <div className="flex justify-between text-xs">
              <span className={`font-semibold ${result?.winner === 'A' ? 'text-amber-400' : 'text-gray-500'}`}>{stratA?.title?.split(' ').slice(0,3).join(' ')}: {result?.winner === 'A' ? winnerVotes : loserVotes} votes</span>
              <span className={`font-semibold ${result?.winner === 'B' ? 'text-amber-400' : 'text-gray-500'}`}>{stratB?.title?.split(' ').slice(0,3).join(' ')}: {result?.winner === 'B' ? winnerVotes : loserVotes} votes</span>
            </div>
          </div>

          {result?.reasoning && (
            <div className="bg-gray-800 rounded-xl p-4 border-l-2 border-amber-400">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Judge Panel Verdict</p>
              <p className="text-sm text-gray-300 leading-relaxed italic">"{result.reasoning}"</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Brain className="w-3 h-3 text-blue-400" /> Key Learning</p>
            {loadingLearning && <div className="flex items-center gap-2 text-sm text-gray-500 italic bg-gray-800 rounded-xl p-4"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block flex-shrink-0" /> Extracting insight…</div>}
            {!loadingLearning && learning && <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-4"><p className="text-sm text-gray-300 leading-relaxed">{learning}</p></div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ s: stratA, isW: result?.winner === 'A', label: `Seed ${seedA}` }, { s: stratB, isW: result?.winner === 'B', label: `Seed ${seedB}` }].map(({ s, isW, label }) => (
              <div key={label}>
                <p className={`text-xs font-bold uppercase mb-2 ${isW ? 'text-amber-400' : 'text-gray-500'}`}>{label}{isW ? ' · 🏆' : ''}</p>
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-400 leading-relaxed">
                  {(s?.content || s?.summary || 'No details available.').slice(0, 220)}{(s?.content || s?.summary || '').length > 220 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Strategy Detail Modal ─────────────────────────────────────────────────────
function StrategyDetail({ standing, answers, onClose }) {
  const [insight, setInsight]         = useState('');
  const [loadingInsight, setLoading]  = useState(false);
  const a = standing.answer;

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const record = standing.record.map(r =>
        `${r.outcome} vs "${answers[r.vs]?.title}" (${r.margin}) — ${r.reasoning}`
      ).join('\n');
      const prompt = `Tournament analyst reviewing "${a.title}":
Record: ${standing.wins}W–${standing.losses}L
Match results:
${record}

Strategy summary: ${(a.content || a.summary || '').slice(0, 400)}

Give a tight 3-sentence analyst commentary: why it won when it won, why it lost when it lost, and one sharp insight about the real-world conditions where this approach would dominate. Be specific and direct.`;

      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://braintrustbrief.local', 'X-Title': 'BrainTrust Brief' },
        body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 250 }),
      });
      const data = await res.json();
      setInsight(data.choices?.[0]?.message?.content?.trim() || 'No insight available.');
    } catch { setInsight('Could not load insight.'); }
    finally { setLoading(false); }
  };

  const total = standing.wins + standing.losses;
  const pct   = total > 0 ? Math.round((standing.wins / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Strategy Performance</p>
            <h3 className="font-black text-white text-lg leading-tight">{a.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-white">{standing.wins}W – {standing.losses}L</span>
              <span className={`text-2xl font-black ${pct >= 60 ? 'text-amber-400' : pct >= 40 ? 'text-gray-300' : 'text-gray-600'}`}>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Match-by-Match Record</p>
            <div className="space-y-2">
              {standing.record.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl text-xs ${r.outcome === 'W' ? 'bg-green-500/8 border border-green-500/15' : 'bg-red-500/8 border border-red-500/15'}`}>
                  <span className={`font-black text-sm flex-shrink-0 mt-0.5 ${r.outcome === 'W' ? 'text-green-400' : 'text-red-400'}`}>{r.outcome}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 font-semibold truncate">vs "{answers[r.vs]?.title}"</p>
                    <p className="text-gray-500 mt-0.5">{r.margin} · {r.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {(a.content || a.summary) && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">The Strategy</p>
              <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 leading-relaxed">{a.content || a.summary}</div>
            </div>
          )}
          {a.rationale && (
            <div className="bg-blue-400/5 border border-blue-400/15 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Brain className="w-3 h-3" /> BrainTrust Rationale</p>
              <p className="text-sm text-gray-300 leading-relaxed italic">"{a.rationale}"</p>
              {a.champion && <p className="text-xs text-blue-400/60 mt-1.5">— Championed by {a.champion}</p>}
            </div>
          )}
          {(a.strengths?.length || a.weaknesses?.length || a.concerns?.length) && (
            <div className="grid grid-cols-3 gap-3">
              {a.strengths?.length > 0 && <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3"><p className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1"><Zap className="w-3 h-3"/>Strengths</p>{a.strengths.map((s, i) => <p key={i} className="text-xs text-gray-300 flex gap-1.5 mb-1"><span className="text-green-400">+</span>{s}</p>)}</div>}
              {a.weaknesses?.length > 0 && <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3"><p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1"><Shield className="w-3 h-3"/>Weaknesses</p>{a.weaknesses.map((w, i) => <p key={i} className="text-xs text-gray-300 flex gap-1.5 mb-1"><span className="text-red-400">−</span>{w}</p>)}</div>}
              {a.concerns?.length > 0 && <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3"><p className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>Concerns</p>{a.concerns.map((c, i) => <p key={i} className="text-xs text-gray-300 flex gap-1.5 mb-1"><span className="text-yellow-400">!</span>{c}</p>)}</div>}
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tournament Analyst Commentary</p>
              {!insight && !loadingInsight && <button onClick={fetchInsight} className="text-xs px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full font-bold hover:bg-amber-400/20 transition">Get Insight →</button>}
            </div>
            {loadingInsight && <p className="text-sm text-gray-500 italic flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" /> Analyzing performance…</p>}
            {insight && <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 leading-relaxed border-l-2 border-amber-400">{insight}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Tournament ───────────────────────────────────────────────────────────
export default function Tournament() {
  const [answers, setAnswers]         = useState([]);
  const [question, setQuestion]       = useState('');
  const [matchups, setMatchups]       = useState([]);
  const [phase, setPhase]             = useState('idle');
  const [completedCount, setCompleted]= useState(0);
  const [activeTab, setActiveTab]     = useState('roundrobin');
  const [selectedStandingIdx, setSelectedStandingIdx] = useState(null);
  const [selectedMatchupIdx, setSelectedMatchupIdx]   = useState(null);

  // Playoffs state
  const [playoffPhase, setPlayoffPhase]   = useState('idle'); // idle | running | done
  const [playoffSeedings, setPlayoffSeedings] = useState([]); // array of 4 strategy objects
  const [playoffSF1, setPlayoffSF1]       = useState(null);   // result object or null
  const [playoffSF2, setPlayoffSF2]       = useState(null);   // result object or null
  const [playoffModal, setPlayoffModal]   = useState(null);   // 'sf1' | 'sf2' | null

  // Finals state
  const [finalsPhase, setFinalsPhase]     = useState('idle'); // idle | running | done
  const [finalsResult, setFinalsResult]   = useState(null);
  const [showFinalsModal, setShowFinalsModal] = useState(false);

  // Playoff preparation state
  // prepPhase: 'choosing' → user picks; 'refining' → AI is working; 'ready' → done, show results
  const [prepPhase, setPrepPhase]         = useState('choosing');
  const [prepChoice, setPrepChoice]       = useState(null); // 'stock' | 'improved'
  const [improvedSeedings, setImprovedSeedings] = useState([]); // refined strategy objects
  const [refiningStates, setRefiningStates]     = useState([]); // 'pending'|'refining'|'done' per slot

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem('btb_answers') || '[]');
      const q = localStorage.getItem('btb_question') || '';
      if (a.length > 0) { setAnswers(a); setQuestion(q); setMatchups(buildMatchups(a)); }
    } catch (e) { /* ignore */ }
  }, []);

  // ─── Round-robin ─────────────────────────────────────────────────────────────
  const startTournament = async () => {
    if (!OPENROUTER_KEY) { alert('OpenRouter API key not configured.'); return; }
    const fresh = buildMatchups(answers);
    setMatchups([...fresh]); setPhase('running'); setCompleted(0);
    const BATCH = 6;
    for (let start = 0; start < fresh.length; start += BATCH) {
      const batchEnd = Math.min(start + BATCH, fresh.length);
      await Promise.all(fresh.slice(start, batchEnd).map(async (_, bi) => {
        const idx = start + bi;
        try {
          const result = await judgeMatchup(question, answers[fresh[idx].aIdx], answers[fresh[idx].bIdx]);
          fresh[idx] = { ...fresh[idx], result };
        } catch {
          fresh[idx] = { ...fresh[idx], result: { winner: Math.random() > 0.5 ? 'A' : 'B', forWinner: 5, reasoning: '(judges unavailable)' } };
        }
        setMatchups([...fresh]); setCompleted(c => c + 1);
      }));
    }
    setPhase('done');
  };

  // ─── Playoffs ────────────────────────────────────────────────────────────────
  // top4 can be original answers or refined versions depending on prep choice
  const startPlayoffs = async (top4 = null) => {
    if (!OPENROUTER_KEY) { alert('OpenRouter API key not configured.'); return; }
    const seedings = top4 || standings.slice(0, 4).map(s => s.answer);
    setPlayoffSeedings(seedings);
    setPlayoffPhase('running');
    setPlayoffSF1(null); setPlayoffSF2(null);

    // Run both semi-finals in parallel
    await Promise.all([
      (async () => {
        try {
          const r = await judgeMatchup(question, seedings[0], seedings[3]);
          setPlayoffSF1(r);
        } catch {
          setPlayoffSF1({ winner: Math.random() > 0.5 ? 'A' : 'B', forWinner: 5, reasoning: '(judges unavailable)' });
        }
      })(),
      (async () => {
        try {
          const r = await judgeMatchup(question, seedings[1], seedings[2]);
          setPlayoffSF2(r);
        } catch {
          setPlayoffSF2({ winner: Math.random() > 0.5 ? 'A' : 'B', forWinner: 5, reasoning: '(judges unavailable)' });
        }
      })(),
    ]);

    setPlayoffPhase('done');
  };

  // ─── Playoff Preparation: refine strategies based on round-robin learnings ────
  const refineStrategiesForPlayoffs = async () => {
    const top4standings = standings.slice(0, 4);
    const top4answers   = top4standings.map(s => s.answer);
    const initial       = top4answers.map(() => ({ status: 'pending', refined: null, keyChange: null }));
    setRefiningStates([...initial]);
    setPrepPhase('refining');

    const updated = [...initial];

    await Promise.all(top4standings.map(async (standing, slotIdx) => {
      // Mark as refining
      updated[slotIdx] = { ...updated[slotIdx], status: 'refining' };
      setRefiningStates([...updated]);

      const strategy = standing.answer;
      const wins     = standing.record.filter(r => r.outcome === 'W');
      const losses   = standing.record.filter(r => r.outcome === 'L');

      const winLines  = wins.map(w  => `Beat "${answers[w.vs]?.title}" (${w.margin}): ${w.reasoning}`).join('\n') || 'No wins yet';
      const lossLines = losses.map(l => `Lost to "${answers[l.vs]?.title}" (${l.margin}): ${l.reasoning}`).join('\n') || 'No losses yet';

      const prompt = `You are a strategic coach helping a team sharpen their pitch before a playoff round.

STRATEGY: "${strategy.title}"
ORIGINAL PITCH: ${(strategy.content || strategy.summary || '').slice(0, 400)}

ROUND-ROBIN RECORD: ${wins.length}W – ${losses.length}L

WHAT JUDGES REWARDED (wins):
${winLines}

WHAT JUDGES PENALIZED (losses):
${lossLines}

Your job: produce a refined version of this strategy's pitch that doubles down on what worked and tightens up what didn't. Keep the same core idea — just sharpen the execution and the framing. Do not invent new features or change the fundamental approach.

Return ONLY valid JSON (no markdown):
{"refinedContent":"2-3 sentence refined pitch","keyChange":"One sentence on the single most important adjustment you made and why the judges' feedback demanded it"}`;

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
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7, max_tokens: 250,
          }),
        });
        const data = await res.json();
        let raw = data.choices?.[0]?.message?.content?.trim() || '{}';
        if (raw.startsWith('```')) raw = raw.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(raw);
        updated[slotIdx] = {
          status: 'done',
          refined: { ...strategy, content: parsed.refinedContent || strategy.content, summary: parsed.refinedContent || strategy.summary },
          keyChange: parsed.keyChange || '',
          original: strategy,
        };
      } catch {
        updated[slotIdx] = {
          status: 'done',
          refined: strategy, // fall back to original on error
          keyChange: 'Could not generate refinement — using original pitch.',
          original: strategy,
        };
      }

      setRefiningStates([...updated]);
    }));

    // All done — store as improvedSeedings and mark ready
    setImprovedSeedings(updated.map(u => u.refined || top4answers[updated.indexOf(u)]));
    setPrepPhase('ready');
    setPrepChoice('improved');
  };

  // ─── Finals ──────────────────────────────────────────────────────────────────
  const startFinals = async () => {
    if (!OPENROUTER_KEY) { alert('OpenRouter API key not configured.'); return; }
    const finalist1 = playoffSF1?.winner === 'A' ? playoffSeedings[0] : playoffSeedings[3];
    const finalist2 = playoffSF2?.winner === 'A' ? playoffSeedings[1] : playoffSeedings[2];
    setFinalsPhase('running'); setFinalsResult(null);
    try {
      const r = await judgeMatchup(question, finalist1, finalist2);
      setFinalsResult(r);
    } catch {
      setFinalsResult({ winner: Math.random() > 0.5 ? 'A' : 'B', forWinner: 5, reasoning: '(judges unavailable)' });
    }
    setFinalsPhase('done');
  };

  const standings    = computeStandings(answers, matchups);
  const isDone       = phase === 'done';
  const isRunning    = phase === 'running';
  const total        = matchups.length;
  const hasEnoughFor = (n) => standings.length >= n;

  // Derived finals participants
  const finalist1 = playoffSeedings.length >= 4 && playoffSF1 ? (playoffSF1.winner === 'A' ? playoffSeedings[0] : playoffSeedings[3]) : null;
  const finalist2 = playoffSeedings.length >= 4 && playoffSF2 ? (playoffSF2.winner === 'A' ? playoffSeedings[1] : playoffSeedings[2]) : null;
  const champion  = finalist1 && finalist2 && finalsResult ? (finalsResult.winner === 'A' ? finalist1 : finalist2) : null;
  const runnerUp  = finalist1 && finalist2 && finalsResult ? (finalsResult.winner === 'A' ? finalist2 : finalist1) : null;

  if (answers.length === 0) {
    return (
      <div className="text-white flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-gray-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black mb-2">No Tournament Data Yet</h2>
          <p className="text-gray-500 text-sm max-w-sm">Run the Arena first to generate strategies — they'll flow directly into the tournament.</p>
        </div>
        <Link to="/arena" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition">
          Go to Arena <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-5">
        <h1 className="text-3xl font-black mb-1">Tournament</h1>
        {question && <p className="text-sm text-amber-400/80 italic max-w-2xl">"{question}"</p>}
        <p className="text-xs text-gray-500 mt-1">{answers.length} strategies · {total} matchups · 9 judges per match</p>
      </div>

      {/* Idle */}
      {phase === 'idle' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-gray-300 mb-1">Ready to run</p>
          <p className="text-xs text-gray-500 mb-4">{total} round-robin battles · live results as they come in · click any match card after for the full breakdown + key learning</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {answers.map((a, i) => <span key={i} className="text-xs px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">{a.title}</span>)}
          </div>
          <button onClick={startTournament} className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition shadow-lg">
            <Swords className="w-4 h-4" /> Start Tournament
          </button>
        </div>
      )}

      {/* Running or Done */}
      {(isRunning || isDone) && (
        <>
          {isRunning && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${(completedCount / total) * 100}%` }} />
              </div>
              <span className="text-xs text-amber-400 font-bold tabular-nums flex-shrink-0">{completedCount}/{total} complete</span>
            </div>
          )}

          {isDone && (
            <div className="flex gap-2 mb-5 flex-wrap">
              {[
                { id: 'roundrobin', label: 'Round Robin', icon: Swords },
                { id: 'playoffs',   label: 'Playoffs',    icon: Star },
                { id: 'finals',     label: 'Finals',      icon: Crown },
                { id: 'report',     label: 'Final Report',icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-amber-400 text-gray-900' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          )}

          {/* ── Round Robin Tab ── */}
          {(isRunning || (isDone && activeTab === 'roundrobin')) && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
              <div>
                {isRunning && <BattleArena matchups={matchups} answers={answers} completedCount={completedCount} total={total} />}
                {isDone && <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5"><span className="text-amber-400">↓</span> Click any match card to see the full breakdown + AI-generated learning</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {matchups.map((m, i) => (
                    <MatchCard key={i} match={m} answers={answers} matchIdx={i} isDone={isDone} onSelect={(idx) => setSelectedMatchupIdx(idx)} />
                  ))}
                </div>
              </div>
              <LiveScoreboard standings={standings} completedCount={completedCount} totalCount={total} onSelect={(i) => setSelectedStandingIdx(i)} />
            </div>
          )}

          {/* Final Standings */}
          {isDone && activeTab === 'roundrobin' && (
            <div className="mt-6">
              <p className="text-sm font-bold text-gray-300 mb-3">Final Standings — click any strategy for full analysis</p>
              <div className="space-y-2">
                {standings.map((s, i) => {
                  const t = s.wins + s.losses;
                  const pct = t > 0 ? Math.round((s.wins / t) * 100) : 0;
                  return (
                    <button key={s.idx} onClick={() => setSelectedStandingIdx(i)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left hover:scale-[1.005] ${i < 4 ? 'bg-gray-900 border-amber-500/30 hover:border-amber-400/60' : 'bg-gray-900/50 border-gray-800 opacity-60 hover:opacity-80'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-gray-900' : i < 4 ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500'}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{s.answer.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 bg-gray-800 rounded-full w-20 overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} /></div>
                          <span className="text-xs text-gray-500">{s.wins}W · {s.losses}L</span>
                        </div>
                      </div>
                      <div className={`text-xl font-black flex-shrink-0 ${i === 0 ? 'text-amber-400' : 'text-gray-500'}`}>{pct}%</div>
                      {i < 4 && <span className="text-xs font-bold px-2 py-1 bg-amber-400/10 text-amber-400 rounded-lg border border-amber-400/20 flex-shrink-0">✓ Advances</span>}
                      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Playoffs Tab ── */}
          {isDone && activeTab === 'playoffs' && (
            <div>
              {!hasEnoughFor(4) ? (
                <div className="text-center py-16 text-gray-500">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-white mb-1">Not enough strategies for playoffs</p>
                  <p className="text-sm">You need at least 4 strategies. Run more in the Arena first.</p>
                </div>
              ) : (
                <div>
                  {/* Seedings header */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Playoff Seeds — Top 4 from Round Robin</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {standings.slice(0, 4).map((s, i) => {
                        const t = s.wins + s.losses;
                        const pct = t > 0 ? Math.round((s.wins / t) * 100) : 0;
                        return (
                          <div key={i} className="bg-gray-800 rounded-xl p-3 text-center">
                            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-gray-900' : 'bg-gray-700 text-white'}`}>{i + 1}</div>
                            <p className="text-xs font-bold text-white truncate">{s.answer.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.wins}W–{s.losses}L · {pct}%</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400/50 inline-block" /> SF1: Seed 1 vs Seed 4</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400/50 inline-block" /> SF2: Seed 2 vs Seed 3</span>
                    </div>
                  </div>

                  {/* ── Playoff Preparation Gate ── */}
                  {playoffPhase === 'idle' && (
                    <div className="mb-6">

                      {/* Step label */}
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-blue-400" />
                        Before the Semi-Finals — How do you want to enter?
                      </p>

                      {/* Choice cards */}
                      {prepPhase === 'choosing' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          {/* Option A: Advance as-is */}
                          <button
                            onClick={() => { setPrepChoice('stock'); setPrepPhase('ready'); }}
                            className="text-left p-5 rounded-2xl border border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800 transition-all group"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-xl bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center transition">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                              <p className="font-black text-white text-sm">Advance As-Is</p>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Take the top 4 strategies into the semi-finals exactly as they are. They earned their seeds — let them compete on original merit.
                            </p>
                            <p className="text-xs text-gray-600 mt-3 font-semibold">Best if → strategies are already strong and the seedings are decisive</p>
                          </button>

                          {/* Option B: Apply learnings */}
                          <button
                            onClick={refineStrategiesForPlayoffs}
                            className="text-left p-5 rounded-2xl border border-blue-400/30 bg-blue-400/5 hover:border-blue-400/60 hover:bg-blue-400/10 transition-all group"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-400/15 group-hover:bg-blue-400/25 flex items-center justify-center transition">
                                <Brain className="w-4 h-4 text-blue-400" />
                              </div>
                              <p className="font-black text-white text-sm">Apply Learnings</p>
                              <span className="text-xs px-1.5 py-0.5 bg-blue-400/20 text-blue-400 rounded font-bold">AI</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Let the AI study what the judges rewarded and penalized in round-robin, then sharpen each strategy's pitch before the semi-finals. Same core idea — tighter execution.
                            </p>
                            <p className="text-xs text-blue-400/60 mt-3 font-semibold">Best if → there were close matchups or clear patterns in the judge feedback</p>
                          </button>
                        </div>
                      )}

                      {/* Refining in progress */}
                      {prepPhase === 'refining' && (
                        <div className="bg-gray-900 border border-blue-400/30 rounded-2xl p-5 mb-4">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5" />
                            Analyzing Round-Robin Feedback &amp; Sharpening Pitches…
                          </p>
                          <div className="space-y-3">
                            {standings.slice(0, 4).map((s, i) => {
                              const state = refiningStates[i]?.status || 'pending';
                              return (
                                <div key={i} className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-all ${
                                    state === 'done'    ? 'bg-green-400 text-gray-900' :
                                    state === 'refining'? 'bg-amber-400 text-gray-900 animate-pulse' :
                                    'bg-gray-800 text-gray-600'
                                  }`}>{i + 1}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold truncate ${state === 'done' ? 'text-white' : state === 'refining' ? 'text-amber-300' : 'text-gray-600'}`}>
                                      {s.answer.title}
                                    </p>
                                    <p className="text-xs text-gray-600">{
                                      state === 'done'     ? '✓ Pitch refined' :
                                      state === 'refining' ? 'Studying judge feedback…' :
                                      'Waiting…'
                                    }</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Refinement results — before/after reveal */}
                      {prepPhase === 'ready' && prepChoice === 'improved' && refiningStates.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Brain className="w-3 h-3 text-blue-400" /> Refined Pitches — Review Before Playoffs
                          </p>
                          {standings.slice(0, 4).map((s, i) => {
                            const slot = refiningStates[i];
                            const original = slot?.original || s.answer;
                            const refined  = slot?.refined  || s.answer;
                            const keyChange= slot?.keyChange || '';
                            const changed  = (refined?.content || refined?.summary) !== (original?.content || original?.summary);
                            return (
                              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-gray-900' : 'bg-gray-700 text-white'}`}>{i + 1}</span>
                                  <p className="font-bold text-white text-sm">{original.title}</p>
                                </div>
                                {changed ? (
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <p className="text-xs text-gray-600 font-bold uppercase mb-1.5">Before</p>
                                      <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-500 leading-relaxed line-through opacity-70">
                                        {(original.content || original.summary || '—').slice(0, 180)}{(original.content || original.summary || '').length > 180 ? '…' : ''}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-blue-400 font-bold uppercase mb-1.5">After ✦</p>
                                      <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-3 text-xs text-gray-300 leading-relaxed">
                                        {(refined.content || refined.summary || '—').slice(0, 180)}{(refined.content || refined.summary || '').length > 180 ? '…' : ''}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-400 leading-relaxed mb-3">
                                    {(original.content || original.summary || '—').slice(0, 180)}
                                  </div>
                                )}
                                {keyChange && (
                                  <div className="flex items-start gap-2 bg-amber-400/5 border border-amber-400/20 rounded-xl px-3 py-2">
                                    <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-300 leading-relaxed">{keyChange}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Run Playoffs button — appears once a choice is made */}
                      {prepPhase === 'ready' && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const top4 = prepChoice === 'improved' && improvedSeedings.length === 4
                                ? improvedSeedings
                                : standings.slice(0, 4).map(s => s.answer);
                              startPlayoffs(top4);
                            }}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition shadow-lg text-base"
                          >
                            <Star className="w-5 h-5" />
                            {prepChoice === 'improved' ? 'Run Playoffs with Refined Pitches' : 'Run Playoffs — 2 Semi-Finals'}
                          </button>
                          {prepPhase === 'ready' && prepChoice === 'improved' && (
                            <button
                              onClick={() => { setPrepChoice('stock'); }}
                              className="text-xs text-gray-500 hover:text-gray-300 transition underline underline-offset-2"
                            >
                              Use original pitches instead
                            </button>
                          )}
                          {prepPhase === 'ready' && prepChoice === 'stock' && (
                            <button
                              onClick={refineStrategiesForPlayoffs}
                              className="text-xs text-blue-400 hover:text-blue-300 transition underline underline-offset-2 flex items-center gap-1"
                            >
                              <Brain className="w-3 h-3" /> Apply learnings instead
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Running indicator */}
                  {playoffPhase === 'running' && (
                    <div className="flex items-center gap-3 mb-5 bg-gray-900 border border-amber-500/40 rounded-2xl p-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-sm font-bold text-amber-400">Semi-finals being judged… {[playoffSF1, playoffSF2].filter(Boolean).length}/2 done</p>
                    </div>
                  )}

                  {/* Semi-final cards */}
                  {(playoffPhase === 'running' || playoffPhase === 'done') && playoffSeedings.length >= 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <BracketCard
                        label="Semi-Final 1 · #1 vs #4"
                        seedA={1} seedB={4}
                        stratA={playoffSeedings[0]} stratB={playoffSeedings[3]}
                        result={playoffSF1}
                        isRunning={playoffPhase === 'running'}
                        isActive={playoffPhase === 'running' && !playoffSF1}
                        onSelect={playoffSF1 ? () => setPlayoffModal('sf1') : undefined}
                      />
                      <BracketCard
                        label="Semi-Final 2 · #2 vs #3"
                        seedA={2} seedB={3}
                        stratA={playoffSeedings[1]} stratB={playoffSeedings[2]}
                        result={playoffSF2}
                        isRunning={playoffPhase === 'running'}
                        isActive={playoffPhase === 'running' && !playoffSF2}
                        onSelect={playoffSF2 ? () => setPlayoffModal('sf2') : undefined}
                      />
                    </div>
                  )}

                  {/* Proceed to Finals CTA */}
                  {playoffPhase === 'done' && (
                    <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-white mb-1">Semi-finals complete!</p>
                        <p className="text-xs text-gray-500">
                          {finalist1?.title} vs {finalist2?.title} advance to the Final
                        </p>
                      </div>
                      <button onClick={() => setActiveTab('finals')} className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition flex-shrink-0 ml-4">
                        <Crown className="w-4 h-4" /> Go to Finals
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Finals Tab ── */}
          {isDone && activeTab === 'finals' && (
            <div>
              {playoffPhase !== 'done' ? (
                <div className="text-center py-16 text-gray-500">
                  <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-white mb-2">Complete the Playoffs First</p>
                  <p className="text-sm mb-4">The two semi-final winners will face off here for the championship.</p>
                  <button onClick={() => setActiveTab('playoffs')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition">
                    <Star className="w-4 h-4" /> Go to Playoffs
                  </button>
                </div>
              ) : (
                <div>
                  {/* Finalists banner */}
                  <div className="bg-gray-900 border border-amber-500/40 rounded-2xl p-5 mb-5">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">🏆 Championship Final</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-800 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Finalist 1</p>
                        <p className="font-black text-white">{finalist1?.title || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Won SF{playoffSF1?.winner === 'A' ? '1' : '1'} — Seed {playoffSF1?.winner === 'A' ? 1 : 4}</p>
                      </div>
                      <div className="flex-shrink-0 text-center">
                        <Crown className="w-8 h-8 text-amber-400 mx-auto" />
                        <p className="text-xs text-amber-400 font-black mt-1">vs</p>
                      </div>
                      <div className="flex-1 bg-gray-800 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Finalist 2</p>
                        <p className="font-black text-white">{finalist2?.title || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Won SF2 — Seed {playoffSF2?.winner === 'A' ? 2 : 3}</p>
                      </div>
                    </div>
                  </div>

                  {/* Start Finals button */}
                  {finalsPhase === 'idle' && (
                    <div className="text-center mb-6">
                      <button onClick={startFinals} className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition shadow-lg text-lg shadow-amber-400/20">
                        <Crown className="w-5 h-5" /> Run the Championship Final
                      </button>
                    </div>
                  )}

                  {/* Running indicator */}
                  {finalsPhase === 'running' && (
                    <div className="flex items-center gap-3 mb-5 bg-gray-900 border border-amber-500/40 rounded-2xl p-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-sm font-bold text-amber-400">Championship final being decided by 9 judges…</p>
                    </div>
                  )}

                  {/* Finals card */}
                  {(finalsPhase === 'running' || finalsPhase === 'done') && (
                    <div className="max-w-xl mx-auto mb-6">
                      <BracketCard
                        label="Championship Final"
                        seedA={playoffSF1?.winner === 'A' ? 1 : 4}
                        seedB={playoffSF2?.winner === 'A' ? 2 : 3}
                        stratA={finalist1} stratB={finalist2}
                        result={finalsResult}
                        isRunning={finalsPhase === 'running'}
                        isActive={finalsPhase === 'running'}
                        onSelect={finalsResult ? () => setShowFinalsModal(true) : undefined}
                      />
                    </div>
                  )}

                  {/* Champion announcement */}
                  {finalsPhase === 'done' && champion && (
                    <div className="bg-gray-900 border border-amber-400/40 rounded-3xl p-8 shadow-xl shadow-amber-400/10 text-center mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-gray-900" />
                      </div>
                      <p className="text-xs text-amber-400 font-black uppercase tracking-widest mb-2">Tournament Champion</p>
                      <h2 className="text-3xl font-black text-white mb-2">{champion.title}</h2>
                      <p className="text-sm text-gray-400 mb-4">{champion.content || champion.summary || ''}</p>
                      {runnerUp && (
                        <p className="text-xs text-gray-500">Runner-up: {runnerUp.title}</p>
                      )}
                      <div className="mt-6">
                        <button onClick={() => setActiveTab('report')} className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition">
                          <FileText className="w-4 h-4" /> View Final Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Final Report Tab ── */}
          {isDone && activeTab === 'report' && (
            <div className="max-w-2xl">
              <div className="bg-gray-900 border border-amber-500/30 rounded-3xl p-8 shadow-xl shadow-amber-500/10 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      {finalsPhase === 'done' && champion ? 'Tournament Champion' : 'Round Robin Leader'}
                    </p>
                    <h2 className="text-2xl font-black text-white">{champion?.title || standings[0]?.answer?.title}</h2>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-2xl p-5 mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Winning Strategy</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{(champion || standings[0]?.answer)?.content || (champion || standings[0]?.answer)?.summary || '(see strategy detail)'}</p>
                </div>
                {(champion || standings[0]?.answer)?.rationale && (
                  <div className="bg-blue-400/5 border border-blue-400/15 rounded-xl px-4 py-3 mb-4">
                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">Rationale</p>
                    <p className="text-sm text-gray-300 italic">"{(champion || standings[0]?.answer).rationale}"</p>
                  </div>
                )}
                <div className="bg-gray-800 rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Runner-Up</p>
                  <p className="text-sm font-bold text-white">{runnerUp?.title || standings[1]?.answer?.title}</p>
                  {!finalsPhase === 'done' && <p className="text-xs text-gray-500 mt-1">{standings[1]?.wins}W – {standings[1]?.losses}L · {Math.round((standings[1]?.wins / (standings[1]?.wins + standings[1]?.losses || 1)) * 100)}%</p>}
                </div>
              </div>
              <div className="text-center">
                <Link to="/arena" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition">
                  <Star className="w-4 h-4" /> Run Another Session
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}

      {/* Round-robin matchup drill-down */}
      {selectedMatchupIdx !== null && matchups[selectedMatchupIdx] && (
        <MatchupDetail
          match={matchups[selectedMatchupIdx]}
          matchIdx={selectedMatchupIdx}
          answers={answers}
          question={question}
          onClose={() => setSelectedMatchupIdx(null)}
        />
      )}

      {/* Strategy detail (from standings) */}
      {selectedStandingIdx !== null && standings[selectedStandingIdx] && (
        <StrategyDetail
          standing={standings[selectedStandingIdx]}
          answers={answers}
          onClose={() => setSelectedStandingIdx(null)}
        />
      )}

      {/* SF1 drill-down */}
      {playoffModal === 'sf1' && playoffSF1 && playoffSeedings.length >= 4 && (
        <BracketMatchupDetail
          label="Semi-Final 1 · #1 vs #4"
          stratA={playoffSeedings[0]} stratB={playoffSeedings[3]}
          seedA={1} seedB={4}
          result={playoffSF1}
          question={question}
          onClose={() => setPlayoffModal(null)}
        />
      )}

      {/* SF2 drill-down */}
      {playoffModal === 'sf2' && playoffSF2 && playoffSeedings.length >= 4 && (
        <BracketMatchupDetail
          label="Semi-Final 2 · #2 vs #3"
          stratA={playoffSeedings[1]} stratB={playoffSeedings[2]}
          seedA={2} seedB={3}
          result={playoffSF2}
          question={question}
          onClose={() => setPlayoffModal(null)}
        />
      )}

      {/* Finals drill-down */}
      {showFinalsModal && finalsResult && finalist1 && finalist2 && (
        <BracketMatchupDetail
          label="Championship Final"
          stratA={finalist1} stratB={finalist2}
          seedA={playoffSF1?.winner === 'A' ? 1 : 4}
          seedB={playoffSF2?.winner === 'A' ? 2 : 3}
          result={finalsResult}
          question={question}
          onClose={() => setShowFinalsModal(false)}
        />
      )}
    </div>
  );
}
