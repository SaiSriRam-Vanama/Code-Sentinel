import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const getSeverityConfig = (severity) => {
    switch (severity?.toUpperCase()) {
        case 'HIGH': return { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/50', dot: 'bg-red-500' };
        case 'MEDIUM': return { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50', dot: 'bg-amber-500' };
        case 'LOW': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', dot: 'bg-emerald-500' };
        default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/40', text: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/50', dot: 'bg-slate-500' };
    }
};

const getRiskColor = (risk) => {
    switch (risk?.toUpperCase()) {
        case 'HIGH': return 'text-red-400';
        case 'MEDIUM': return 'text-amber-400';
        case 'LOW': return 'text-emerald-400';
        default: return 'text-slate-400';
    }
};

const ScoreGauge = ({ label, score }) => {
    const getScoreColor = (s) => {
        if (s >= 80) return 'from-emerald-500 to-teal-500';
        if (s >= 55) return 'from-amber-500 to-orange-500';
        return 'from-red-500 to-rose-600';
    };
    const textColor = score >= 80 ? 'text-emerald-400' : score >= 55 ? 'text-amber-400' : 'text-red-400';
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
                <span style={{ color: '#94a3b8' }}>{label}</span>
                <span className={`font-bold text-base ${textColor}`}>{score}/100</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-1000`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
};

const ConfidenceBar = ({ confidence }) => (
    <div className="flex items-center gap-2">
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>AI Confidence</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700" style={{ width: `${confidence}%` }} />
        </div>
        <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 600 }}>{confidence}%</span>
    </div>
);

const IssueCard = ({ issue }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = getSeverityConfig(issue.severity);
    const impacts = issue.impact ? issue.impact.split(',').map(i => i.trim()).filter(Boolean) : [];

    return (
        <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all duration-300 hover:shadow-xl`} style={{ boxShadow: 'none' }}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} mt-1`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${cfg.badge}`}>{issue.severity}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>{issue.issue_type}</span>
                        </div>
                        <div className="font-bold text-white text-base mt-1 leading-snug">{issue.title || issue.issue_type}</div>
                        {issue.file_path && (
                            <div className="text-xs mt-1 font-mono truncate" style={{ color: '#475569' }}>
                                📄 {issue.file_path}{issue.line_number && issue.line_number !== 0 ? ` : Line ${issue.line_number}` : ''}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {issue.confidence && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                            {issue.confidence}% confident
                        </span>
                    )}
                    <svg className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} style={{ color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-5 pb-5 flex flex-col gap-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    {/* Problem explanation */}
                    <div className="pt-4">
                        <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#64748b' }}>Problem</div>
                        <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{issue.explanation}</p>
                    </div>

                    {/* Impact */}
                    {impacts.length > 0 && (
                        <div>
                            <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#64748b' }}>Estimated Impact</div>
                            <ul className="flex flex-col gap-1">
                                {impacts.map((imp, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#fca5a5' }}>
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                        {imp}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Suggested Fix */}
                    <div>
                        <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#64748b' }}>AI Suggested Fix</div>
                        <p className="text-sm leading-relaxed" style={{ color: '#86efac' }}>{issue.suggested_fix}</p>
                    </div>

                    {/* Code snippet */}
                    {issue.improved_code && (
                        <div>
                            <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#64748b' }}>Improved Code</div>
                            <pre className="rounded-lg p-4 text-sm overflow-x-auto font-mono" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)', color: '#4ade80' }}>
                                <code>{issue.improved_code}</code>
                            </pre>
                        </div>
                    )}

                    {/* Confidence bar */}
                    {issue.confidence && <ConfidenceBar confidence={issue.confidence} />}
                </div>
            )}
        </div>
    );
};

export default function Dashboard() {
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentPRId, setCurrentPRId] = useState(null);
    const [prData, setPrData] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        try {
            const data = await api.listPRs();
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        if (!currentPRId) return;
        const interval = setInterval(async () => {
            try {
                const data = await api.getPRStatus(currentPRId);
                setPrData(data);
                if (data.pr.status === 'completed' || data.pr.status === 'failed') {
                    setLoading(false);
                    clearInterval(interval);
                    fetchHistory();
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
                clearInterval(interval);
            }
        }, 2500);
        return () => clearInterval(interval);
    }, [currentPRId, fetchHistory]);

    const handleAnalyze = async () => {
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
        if (!match) {
            setError('Please enter a valid GitHub PR URL (e.g. https://github.com/owner/repo/pull/1)');
            return;
        }
        const [, owner, repo, prNumber] = match;
        setError(null);
        setLoading(true);
        setPrData(null);
        setCurrentPRId(null);
        try {
            const response = await api.analyzePR(owner, repo, prNumber);
            setCurrentPRId(response.pr_id);
        } catch (err) {
            setError('Failed to start analysis. Is the backend server running?');
            setLoading(false);
        }
    };

    const highIssues = prData?.issues?.filter(i => i.severity?.toUpperCase() === 'HIGH') || [];
    const mediumIssues = prData?.issues?.filter(i => i.severity?.toUpperCase() === 'MEDIUM') || [];
    const lowIssues = prData?.issues?.filter(i => i.severity?.toUpperCase() === 'LOW') || [];
    const totalIssues = prData?.issues?.length || 0;

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1628 50%, #0f172a 100%)' }}>
            {/* Animated background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', top: '-10%', left: '-5%' }} />
                <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', bottom: '10%', right: '-5%' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">

                {/* ── Header ── */}
                <header className="text-center flex flex-col items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        AI-Powered Code Review
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight" style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        CodeSentinel
                    </h1>
                    <p className="text-lg max-w-xl" style={{ color: '#64748b' }}>
                        Detect bugs, security vulnerabilities, and performance issues before merging.
                    </p>
                </header>

                {/* ── Input ── */}
                <div className="rounded-2xl p-8" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Analyze Pull Request</label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="https://github.com/owner/repo/pull/1"
                            value={repoUrl}
                            onChange={e => setRepoUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    Analyzing...
                                </span>
                            ) : 'Run Analysis'}
                        </button>
                    </div>
                    {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                </div>

                {/* ── Analyzing Spinner ── */}
                {loading && !prData && (
                    <div className="flex flex-col items-center gap-4 py-16">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />
                            <div className="relative w-16 h-16 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: '#3b82f6', borderRightColor: '#8b5cf6' }} />
                        </div>
                        <p className="text-sm animate-pulse" style={{ color: '#64748b' }}>AI is reviewing the pull request...</p>
                    </div>
                )}

                {/* ── Results ── */}
                {prData?.pr?.status === 'completed' && (
                    <div className="flex flex-col gap-6">

                        {/* Title row */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">AI Review Report</h2>
                                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                                    {prData.pr.repo_url} · PR #{prData.pr.pr_number}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span className="text-sm" style={{ color: '#64748b' }}>Overall Risk</span>
                                <span className={`text-lg font-bold ${getRiskColor(prData.pr.overall_risk)}`}>{prData.pr.overall_risk}</span>
                            </div>
                        </div>

                        {/* Scores + Summary Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Scores card */}
                            <div className="md:col-span-2 rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>Risk Scores</h3>
                                <ScoreGauge label="Security" score={prData.pr.security_score} />
                                <ScoreGauge label="Performance" score={prData.pr.performance_score} />
                                <ScoreGauge label="Maintainability" score={prData.pr.maintainability_score} />
                            </div>

                            {/* Issues summary card */}
                            <div className="rounded-2xl p-6 flex flex-col gap-4 justify-center" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>Issues Found</h3>
                                <div className="text-5xl font-black text-white">{totalIssues}</div>
                                <div className="flex flex-col gap-2">
                                    {highIssues.length > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span style={{ color: '#f87171' }}>● High</span>
                                            <span className="font-bold text-white">{highIssues.length}</span>
                                        </div>
                                    )}
                                    {mediumIssues.length > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span style={{ color: '#fbbf24' }}>● Medium</span>
                                            <span className="font-bold text-white">{mediumIssues.length}</span>
                                        </div>
                                    )}
                                    {lowIssues.length > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span style={{ color: '#34d399' }}>● Low</span>
                                            <span className="font-bold text-white">{lowIssues.length}</span>
                                        </div>
                                    )}
                                    {totalIssues === 0 && (
                                        <span className="text-sm" style={{ color: '#34d399' }}>✓ No issues detected!</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Issues list */}
                        {totalIssues > 0 && (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-lg font-bold text-white">Detected Issues</h3>
                                {/* HIGH first, then MEDIUM, then LOW */}
                                {[...highIssues, ...mediumIssues, ...lowIssues].map((issue, idx) => (
                                    <IssueCard key={idx} issue={issue} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Failed State ── */}
                {prData?.pr?.status === 'failed' && (
                    <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p className="text-red-400 font-semibold text-lg">Analysis Failed</p>
                        <p className="text-sm mt-2" style={{ color: '#64748b' }}>Check that your backend is running and the Gemini API key is valid.</p>
                    </div>
                )}

                {/* ── History ── */}
                {history.length > 0 && !prData && !loading && (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Recent Reviews</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.map(pr => (
                                <div
                                    key={pr.id}
                                    className="rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                                    style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                                    onClick={() => { setCurrentPRId(pr.id); api.getPRStatus(pr.id).then(d => setPrData(d)); }}
                                >
                                    <div className="text-xs truncate" style={{ color: '#475569' }}>{pr.repo_url}</div>
                                    <div className="font-bold text-white text-base mt-1">PR #{pr.pr_number}</div>
                                    <div className="flex items-center justify-between mt-3 text-xs">
                                        <span className={pr.status === 'completed' ? 'text-emerald-400' : pr.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>
                                            {pr.status}
                                        </span>
                                        {pr.overall_risk && (
                                            <span className={`font-bold ${getRiskColor(pr.overall_risk)}`}>Risk: {pr.overall_risk}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
