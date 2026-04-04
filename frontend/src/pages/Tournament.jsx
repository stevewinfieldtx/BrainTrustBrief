import { useState } from 'react';
import { Trophy, Swords, Star, Crown, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

// Placeholder tournament data (will be driven by AI backend)
const MOCK_ANSWERS = [
  { id: 1, title: 'The Aggressive European First Strategy',    wins: 5, losses: 2, score: 71 },
  { id: 2, title: 'The US-First Domination Play',             wins: 6, losses: 1, score: 86 },
  { id: 3, title: 'The Simultaneous Dual-Market Blitz',       wins: 4, losses: 3, score: 57 },
  { id: 4, title: 'The Partner-Led European Infiltration',    wins: 5, losses: 2, score: 71 },
  { id: 5, title: 'The Beachhead Country Playbook',           wins: 3, losses: 4, score: 43 },
  { id: 6, title: 'The VC-Funded Blitzscaling Approach',      wins: 2, losses: 5, score: 29 },
  { id: 7, title: 'The Customer-Referral Organic Expansion',  wins: 1, losses: 6, score: 14 },
  { id: 8, title: 'The Wait-and-Watch Defensive Position',    wins: 2, losses: 5, score: 29 },
];

const TOP_4 = MOCK_ANSWERS.sort((a, b) => b.score - a.score).slice(0, 4);

const BRACKETS = {
  semifinal: [
    { matchup: [TOP_4[0], TOP_4[3]], label: '#1 vs #4' },
    { matchup: [TOP_4[1], TOP_4[2]], label: '#2 vs #3' },
  ],
  final: [
    { matchup: [TOP_4[0], TOP_4[1]], label: 'Championship' },
  ],
};

function ScoreBar({ value }) {
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-24">
      <div
        className="h-full bg-amber-400 rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function Tournament() {
  const [activeTab, setActiveTab] = useState('roundrobin');

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-1">Tournament Bracket</h1>
        <p className="text-gray-400">28 round-robin battles. 2 playoff rounds. 1 champion.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'roundrobin', label: 'Round Robin', icon: Swords },
          { id: 'playoffs',   label: 'Playoffs',    icon: Star },
          { id: 'finals',     label: 'Finals',      icon: Crown },
          { id: 'result',     label: 'Final Report',icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === id
                ? 'bg-amber-400 text-gray-900'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Round Robin Tab */}
      {activeTab === 'roundrobin' && (
        <div>
          <p className="text-sm text-gray-500 mb-6">All 8 answers face each other once. Top 4 by win percentage advance to playoffs.</p>

          <div className="space-y-3 mb-8">
            {MOCK_ANSWERS.sort((a, b) => b.score - a.score).map((a, idx) => (
              <div
                key={a.id}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition ${
                  idx < 4
                    ? 'bg-gray-900 border-amber-500/30 shadow-md shadow-amber-500/5'
                    : 'bg-gray-900/50 border-gray-800 opacity-60'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  idx === 0 ? 'bg-amber-400 text-gray-900' :
                  idx < 4   ? 'bg-gray-700 text-white' :
                              'bg-gray-800 text-gray-500'
                }`}>
                  {idx + 1}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{a.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <ScoreBar value={a.score} />
                    <span className="text-xs text-gray-500">{a.wins}W · {a.losses}L</span>
                  </div>
                </div>

                {/* Score */}
                <div className={`text-xl font-black flex-shrink-0 ${
                  idx === 0 ? 'text-amber-400' : 'text-gray-500'
                }`}>
                  {a.score}%
                </div>

                {/* Playoff badge */}
                {idx < 4 && (
                  <span className="flex-shrink-0 text-xs font-bold px-2 py-1 bg-amber-400/10 text-amber-400 rounded-lg border border-amber-400/20">
                    ✓ Advances
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-bold text-gray-400 mb-2">How Round Robin Works</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Each of the 8 generated answers is paired against every other answer — 28 total matchups.
              The BrainTrust votes on each battle. No ties allowed. The win percentage determines seeding.
              Top 4 advance to the playoff bracket. Before playoffs begin, each answer's team is allowed
              to refine and improve their pitch using what they learned in the round robin.
            </p>
          </div>
        </div>
      )}

      {/* Playoffs Tab */}
      {activeTab === 'playoffs' && (
        <div>
          <p className="text-sm text-gray-500 mb-6">Best of 5 series. BrainTrust can improve between each game.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {BRACKETS.semifinal.map(({ matchup, label }) => (
              <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="px-5 py-3 bg-gray-800/50 border-b border-gray-800">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Swords className="w-3.5 h-3.5" /> Semifinal — {label}
                  </p>
                </div>
                <div className="p-5 space-y-3">
                  {matchup.map((a, i) => (
                    <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                      i === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-800 bg-gray-800/30'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        i === 0 ? 'bg-amber-400 text-gray-900' : 'bg-gray-700 text-white'
                      }`}>
                        #{i === 0 ? '1' : '4'}
                      </div>
                      <p className="text-sm font-semibold text-white flex-1">{a.title}</p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-600 text-center pt-1">Best of 5 · BrainTrust refines between games</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-bold text-gray-400 mb-2">Playoff Format</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Semifinals are best-of-5. After each game, the losing answer's BrainTrust team is allowed to
              revise and improve the pitch using feedback from the judges. This means the series gets more
              competitive with each game — the eventual winners have been stress-tested and sharpened.
            </p>
          </div>
        </div>
      )}

      {/* Finals Tab */}
      {activeTab === 'finals' && (
        <div>
          <p className="text-sm text-gray-500 mb-6">Best of 7 championship. The ultimate battle.</p>

          <div className="max-w-lg mx-auto">
            <div className="bg-gray-900 rounded-3xl border border-amber-500/30 overflow-hidden shadow-xl shadow-amber-500/10">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-b border-amber-500/20">
                <p className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Championship — Best of 7
                </p>
              </div>
              <div className="p-6 space-y-4">
                {BRACKETS.final[0].matchup.map((a, i) => (
                  <div key={a.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    i === 0
                      ? 'border-amber-400/40 bg-amber-400/5'
                      : 'border-gray-700 bg-gray-800/30'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                      i === 0 ? 'bg-amber-400 text-gray-900' : 'bg-gray-700 text-white'
                    }`}>
                      {i === 0 ? '1' : '2'}
                    </div>
                    <div>
                      <p className="font-bold text-white">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.score}% round robin · {a.wins}W {a.losses}L</p>
                    </div>
                  </div>
                ))}

                <div className="text-center pt-2">
                  <div className="inline-block text-3xl font-black text-gray-700">VS</div>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Best of 7 · BrainTrust improves between every game · Winner gets the full report
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Report Tab */}
      {activeTab === 'result' && (
        <div className="max-w-3xl">
          <div className="bg-gray-900 rounded-3xl border border-amber-500/30 p-8 mb-6 shadow-xl shadow-amber-500/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Champion</p>
                <h2 className="text-xl font-black text-white">{TOP_4[0].title}</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  [The winning answer's full detailed write-up will appear here. The BrainTrust will produce a
                  comprehensive analysis covering the core recommendation, supporting rationale, implementation
                  roadmap, risk factors, and the key insights that emerged through the tournament process.]
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dissenting Opinion</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  [The runner-up's strongest arguments will be preserved here as a detailed dissenting opinion —
                  including the strongest counterarguments, what the winner got wrong, and the scenarios under
                  which the dissenting view would have won.]
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/arena"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-gray-900 font-black text-lg rounded-2xl hover:bg-amber-300 transition shadow-lg"
            >
              <Star className="w-5 h-5" /> Start a New Session
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
