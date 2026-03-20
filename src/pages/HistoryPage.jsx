import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Database,
    Clock,
    Check,
    X,
    Loader2,
    Building2,
    Building,
    UserPlus,
    FileCode,
    Search,
    Filter,
    Package,
    UsersRound,
    CircleDot,
    Server,
    ChevronRight,
    Pause,
} from 'lucide-react';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { apiFetch } from '../lib/api.js';

const MODE_META = {
    org: { icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', tag: 'Org copy' },
    company: { icon: Building, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', tag: 'Company copy' },
    user: { icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', tag: 'Create users' },
    script: { icon: FileCode, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', tag: 'Script' },
    'inventory-permissions': { icon: Package, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', tag: 'Inventory' },
    'bulk-users-sheet': { icon: UsersRound, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', tag: 'Bulk users' },
};

const DEFAULT_MODE_META = { icon: CircleDot, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', tag: 'Task' };

const STATUS_BADGE = {
    completed: { variant: 'success', icon: Check, label: 'Completed' },
    failed: { variant: 'destructive', icon: X, label: 'Failed' },
    running: { variant: 'warning', icon: Loader2, label: 'Running' },
    pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
    paused: { variant: 'secondary', icon: Pause, label: 'Paused' },
};

const MODE_FILTERS = ['all', 'org', 'company', 'user', 'script', 'inventory-permissions', 'bulk-users-sheet'];
const STATUS_FILTERS = ['all', 'completed', 'failed', 'running', 'paused'];

function formatDate(ts) {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

function formatDuration(startedAt, endedAt) {
    if (!startedAt) return null;
    const a = new Date(startedAt).getTime();
    const b = endedAt ? new Date(endedAt).getTime() : Date.now();
    if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
    const sec = Math.round((b - a) / 1000);
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
}

function stepSummary(steps) {
    if (!Array.isArray(steps) || steps.length === 0) return null;
    const total = steps.length;
    const completed = steps.filter((s) => s.status === 'completed').length;
    const failed = steps.filter((s) => s.status === 'failed').length;
    return { total, completed, failed };
}

/** One-line context from stored request (no secrets). */
function requestContext(mode, request) {
    if (!request || typeof request !== 'object') return null;
    const r = request;
    if (mode === 'user') {
        const parts = [];
        if (r.companyId) parts.push(`Company #${r.companyId}`);
        if (r.email) parts.push(String(r.email));
        if (r.numberOfUsers != null) parts.push(`${r.numberOfUsers} user(s)`);
        return parts.length ? parts.join(' · ') : null;
    }
    if (mode === 'company') {
        const parts = [];
        if (r.targetOrgId) parts.push(`Org #${r.targetOrgId}`);
        if (r.sourceCompanyId) parts.push(`from company #${r.sourceCompanyId}`);
        return parts.length ? parts.join(' · ') : null;
    }
    if (mode === 'org') {
        if (r.sourceOrgId) return `Source org #${r.sourceOrgId}${r.newOrgName ? ` → ${r.newOrgName}` : ''}`;
        return null;
    }
    if (mode === 'inventory-permissions') {
        if (r.clientCompanyId) return `Client #${r.clientCompanyId}`;
        return null;
    }
    if (mode === 'script' && r.script) return `${r.script}`;
    if (mode === 'bulk-users-sheet') {
        if (r.mode === 'json') return 'JSON / prepared rows';
        if (r.mode === 'multipart') return 'Spreadsheet upload';
        return null;
    }
    return null;
}

function rowSearchText(r) {
    const req = r.request && typeof r.request === 'object' ? r.request : {};
    const flat = [
        r.label,
        r.user,
        r.userEmail,
        r.mode,
        r.resultMessage,
        r.activeEnv,
        ...Object.values(req).map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)),
  ].filter(Boolean).map(String);
    return flat.join(' ').toLowerCase();
}

function HistoryPage() {
    const navigate = useNavigate();
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        apiFetch('/api/history?limit=200')
            .then((res) => (res.ok ? res.json() : []))
            .then((rows) => {
                if (!active) return;
                if (Array.isArray(rows)) setRuns(rows);
                else setRuns([]);
            })
            .catch(() => active && setRuns([]))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMode, setFilterMode] = useState('all');

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return runs.filter((r) => {
            if (filterStatus !== 'all' && r.status !== filterStatus) return false;
            if (filterMode !== 'all' && r.mode !== filterMode) return false;
            if (q && !rowSearchText(r).includes(q)) return false;
            return true;
        });
    }, [runs, searchQuery, filterStatus, filterMode]);

    const stats = useMemo(() => ({
        total: runs.length,
        completed: runs.filter((r) => r.status === 'completed').length,
        failed: runs.filter((r) => r.status === 'failed').length,
        running: runs.filter((r) => r.status === 'running').length,
        paused: runs.filter((r) => r.status === 'paused').length,
    }), [runs]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
            <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-10 shadow-sm shadow-slate-200/50">
                <Link to="/" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to app">
                    <ArrowLeft className="size-5 text-slate-600" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
                        <Database className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Task history</h1>
                        <p className="text-xs text-slate-500">
                            {loading ? 'Loading…' : `${stats.total} saved run${stats.total === 1 ? '' : 's'} · audits & outcomes`}
                        </p>
                    </div>
                </div>
                <div className="flex-1" />
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: 'Total', value: stats.total, sub: 'all time', className: 'bg-white border-slate-200' },
                        { label: 'Done', value: stats.completed, sub: 'success', className: 'bg-emerald-50/80 border-emerald-100' },
                        { label: 'Failed', value: stats.failed, sub: 'needs review', className: 'bg-red-50/80 border-red-100' },
                        { label: 'Running', value: stats.running, sub: 'in progress', className: 'bg-blue-50/80 border-blue-100' },
                        { label: 'Paused', value: stats.paused, sub: 'resume', className: 'bg-amber-50/80 border-amber-100' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.className}`}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{s.value}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
                            placeholder="Search label, user, email, outcome, env, IDs…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                                <Filter className="size-3.5" /> Status
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {STATUS_FILTERS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFilterStatus(s)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors capitalize ${
                                            filterStatus === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-start gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 pt-1.5 w-[52px] sm:w-auto">
                                Type
                            </span>
                            <div className="flex flex-wrap gap-1.5 flex-1">
                                {MODE_FILTERS.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setFilterMode(m)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                                            filterMode === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {m === 'all' ? 'All' : (MODE_META[m]?.tag || m.replace(/-/g, ' '))}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="size-8 text-blue-500 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
                        <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <Clock className="size-8 text-slate-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-semibold text-slate-700 mb-1">
                            {runs.length === 0 ? 'No history yet' : 'No matching runs'}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm">
                            {runs.length === 0 ? 'Run a task from the main page — it will show up here with full detail.' : 'Try loosening filters or clearing the search.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filtered.map((run) => {
                                const meta = MODE_META[run.mode] || DEFAULT_MODE_META;
                                const Icon = meta.icon;
                                const sb = STATUS_BADGE[run.status] || STATUS_BADGE.pending;
                                const SbIcon = sb.icon;
                                const dur = formatDuration(run.startedAt, run.endedAt);
                                const ss = stepSummary(run.steps);
                                const ctx = requestContext(run.mode, run.request);
                                return (
                                    <motion.div
                                        key={run.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -12 }}
                                        layout
                                        onClick={() => navigate(`/history/${run.id}`)}
                                        className="cursor-pointer group"
                                    >
                                        <Card className="rounded-2xl border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200/60 transition-all duration-200">
                                            <div className="flex items-stretch gap-0">
                                                <div className={`w-1 shrink-0 ${run.status === 'failed' ? 'bg-red-400' : run.status === 'completed' ? 'bg-emerald-400' : run.status === 'running' ? 'bg-blue-400' : 'bg-slate-300'}`} />
                                                <div className="flex-1 min-w-0 px-4 py-4 sm:px-5">
                                                    <div className="flex items-start gap-3 sm:gap-4">
                                                        <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.border} border shrink-0`}>
                                                            <Icon className={`size-5 ${meta.color}`} strokeWidth={1.8} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 gap-y-1">
                                                                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[min(100%,28rem)]">{run.label || run.id}</h3>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${meta.color} ${meta.bg} px-2 py-0.5 rounded-md`}>
                                                                    {meta.tag}
                                                                </span>
                                                                <Badge variant={sb.variant} className="text-[10px] px-2 py-0.5 gap-1">
                                                                    <SbIcon className={`size-3 ${run.status === 'running' ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                                                                    {sb.label}
                                                                </Badge>
                                                            </div>
                                                            {ctx && <p className="text-xs text-slate-600 mt-1.5 font-medium truncate">{ctx}</p>}
                                                            {run.resultMessage && (
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{run.resultMessage}</p>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-slate-500">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Clock className="size-3 shrink-0" />
                                                                    {formatDate(run.startedAt)}
                                                                </span>
                                                                {dur && (
                                                                    <span className="inline-flex items-center gap-1 text-slate-600">
                                                                        Duration: <strong className="font-semibold text-slate-700">{dur}</strong>
                                                                    </span>
                                                                )}
                                                                {run.activeEnv && (
                                                                    <span className="inline-flex items-center gap-1 text-slate-600">
                                                                        <Server className="size-3 shrink-0" />
                                                                        {run.activeEnv}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {(run.user || run.userEmail) && (
                                                                <p className="text-[11px] text-slate-500 mt-2">
                                                                    <span className="font-medium text-slate-600">Started by</span>
                                                                    {run.user && ` ${run.user}`}
                                                                    {run.userEmail && <span className="text-slate-400"> · {run.userEmail}</span>}
                                                                </p>
                                                            )}
                                                            {ss && (
                                                                <div className="mt-3 space-y-1">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                                        Steps {ss.completed}/{ss.total} completed
                                                                        {ss.failed > 0 && <span className="text-red-600 ml-1">({ss.failed} failed)</span>}
                                                                    </p>
                                                                    <div className="flex items-center gap-0.5 h-1.5">
                                                                        {run.steps.map((s, i) => (
                                                                            <div
                                                                                key={s.id || i}
                                                                                className={`flex-1 min-w-0 h-full rounded-full ${
                                                                                    s.status === 'completed' ? 'bg-emerald-400' :
                                                                                    s.status === 'failed' ? 'bg-red-400' :
                                                                                    s.status === 'running' ? 'bg-blue-400 animate-pulse' :
                                                                                    'bg-slate-200'
                                                                                }`}
                                                                                title={`${s.label || s.id}: ${s.status}`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <ChevronRight className="size-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;
