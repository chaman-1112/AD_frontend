import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SCRIPT_FIELDS } from './components/ScriptRunnerForm.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import MainContent from './components/MainContent.jsx';
import { OrgForm, CompanyForm, UserForm, InventoryPermissionForm, ScriptForm, BulkUsersSheetForm } from './components/SidebarForms.jsx';
import { NAV_ITEMS, STEP_DEFS } from './constants.js';
import { apiFetch } from './lib/api.js';

const BULK_CREATED_CSV_HEADER = 'username,userId,email';

/** Merge server `createdUsersCsv` chunks from resumed runs (keyed by user id). */
function mergeBulkCreatedUsersCsv(prevCsv, incomingCsv) {
    const collect = (text) => {
        const map = new Map();
        if (!text || !String(text).trim()) return map;
        for (const line of String(text).trim().split('\n')) {
            const t = line.trim();
            if (!t || t === BULK_CREATED_CSV_HEADER) continue;
            const m = t.match(/,(\d+),/);
            if (m) map.set(m[1], t);
        }
        return map;
    };
    const merged = collect(prevCsv);
    for (const [id, line] of collect(incomingCsv)) merged.set(id, line);
    if (merged.size === 0) {
        const fb = incomingCsv && String(incomingCsv).trim() ? incomingCsv : prevCsv;
        return fb && String(fb).trim() ? fb : `${BULK_CREATED_CSV_HEADER}\n`;
    }
    const lines = [...merged.entries()]
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, row]) => row);
    return [BULK_CREATED_CSV_HEADER, ...lines].join('\n');
}

function App() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('org');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [orgs, setOrgs] = useState([]);
    const [dbStatus, setDbStatus] = useState('checking');
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const abortRef = useRef(null);
    const startingRef = useRef(false);

    const [companies, setCompanies] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [orgDetails, setOrgDetails] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);

    const [newOrgName, setNewOrgName] = useState('');
    const [newDomainUrl, setNewDomainUrl] = useState('');
    const [newCompanyName, setNewCompanyName] = useState('');

    const [ccSourceOrg, setCcSourceOrg] = useState('');
    const [ccCompanies, setCcCompanies] = useState([]);
    const [ccSelectedCompany, setCcSelectedCompany] = useState('');
    const [ccDestOrg, setCcDestOrg] = useState('');
    const [ccNewName, setCcNewName] = useState('');

    const [cuBaseUrl, setCuBaseUrl] = useState('');
    const [cuEmail, setCuEmail] = useState('');
    const [cuPassword, setCuPassword] = useState('');
    const [cuCompanyId, setCuCompanyId] = useState('');
    const [cuName, setCuName] = useState('');
    const [cuCount, setCuCount] = useState(3);

    const [bulkUserFile, setBulkUserFile] = useState(null);
    const [bulkUserSheetName, setBulkUserSheetName] = useState('');
    const [bulkUsersValidating, setBulkUsersValidating] = useState(false);
    const [bulkPreparedPayload, setBulkPreparedPayload] = useState(null);
    const [bulkResume, setBulkResume] = useState({ startIndex: 0, usernameOverrides: {} });
    const [bulkUsernameConflictModal, setBulkUsernameConflictModal] = useState(null);
    const [bulkLastCreatedCsv, setBulkLastCreatedCsv] = useState('');
    const [bulkConflictReplacementUsername, setBulkConflictReplacementUsername] = useState('');
    /** From last successful /api/bulk-users/parse — username issues only */
    const [bulkValidationUsernames, setBulkValidationUsernames] = useState(null);
    /** If true, bulk run calls superadmin to mark email verified after each user create */
    const [bulkVerifyEmailAfterCreate, setBulkVerifyEmailAfterCreate] = useState(true);

    const handleBulkUserFileChange = useCallback((f) => {
        setBulkUserFile(f);
        setBulkPreparedPayload(null);
        setBulkResume({ startIndex: 0, usernameOverrides: {} });
        setBulkLastCreatedCsv('');
        setBulkUsernameConflictModal(null);
        setBulkValidationUsernames(null);
    }, []);
    const [ipClientCompanyId, setIpClientCompanyId] = useState('');
    const [ipVendorCompanyIds, setIpVendorCompanyIds] = useState('');
    const [ipCreateApiClient, setIpCreateApiClient] = useState(true);
    const [ipProducts, setIpProducts] = useState({
        diamond: true,
        gemstone: true,
        jewelry: true,
        labgrown_diamond: true,
    });

    const [scriptValues, setScriptValues] = useState({});

    const [steps, setSteps] = useState([]);
    const [isPaused, setIsPaused] = useState(false);
    const [currentRunId, setCurrentRunId] = useState(null);
    const [lastRunParams, setLastRunParams] = useState(null);
    const stepsRef = useRef([]);
    const [runStartTime, setRunStartTime] = useState(null);
    const [currentUser, setCurrentUser] = useState({ name: 'Unknown', email: null });

    const [runHistory, setRunHistory] = useState([]);
    const [activeHistoryId, setActiveHistoryId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const addToHistory = useCallback((run) => {
        setRunHistory(prev => {
            return [run, ...prev.filter(r => r.id !== run.id)].slice(0, 50);
        });
    }, []);

    const updateHistoryRun = useCallback((runId, updates) => {
        setRunHistory(prev => {
            return prev.map(r => r.id === runId ? { ...r, ...updates } : r);
        });
    }, []);

    const fetchHistory = useCallback(() => {
        apiFetch('/api/history?limit=50')
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => { if (Array.isArray(rows)) setRunHistory(rows); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(''), 6000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    // ── Data fetching ──
    const refreshAppData = useCallback(() => {
        apiFetch('/api/health').then(r => r.json()).then(d => setDbStatus(d.status === 'ok' ? 'connected' : 'error')).catch(() => setDbStatus('error'));
        apiFetch('/api/data/orgs').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { if (Array.isArray(d)) setOrgs(d); }).catch(() => setOrgs([]));
        apiFetch('/api/whoami').then(r => r.json()).then((d) => {
            const user = { name: d?.name || 'Unknown', email: d?.email || null };
            setCurrentUser(user);
        }).catch(() => {});
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => { refreshAppData(); }, [refreshAppData]);
    useEffect(() => {
        if (!isRunning) fetchHistory();
    }, [isRunning, fetchHistory]);

    const handleLogout = useCallback(async () => {
        await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        navigate('/login', { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!selectedOrg) { setCompanies([]); setSelectedCompany(null); setOrgDetails(null); setCompanyDetails(null); return; }
        apiFetch(`/api/data/orgs/${selectedOrg}`).then(r => r.json()).then(d => { setOrgDetails(d); setNewOrgName(`Copy of ${d.name}`); setNewDomainUrl(`copy-${d.domain_url || 'org'}-${Date.now()}`); }).catch(console.error);
        apiFetch(`/api/data/companies?org_id=${selectedOrg}`).then(r => r.json()).then(setCompanies).catch(console.error);
        setSelectedCompany(null); setCompanyDetails(null);
    }, [apiFetch, selectedOrg]);

    useEffect(() => {
        if (!selectedCompany) { setCompanyDetails(null); setNewCompanyName(''); return; }
        apiFetch(`/api/data/companies/${selectedCompany}`).then(r => r.json()).then(d => { setCompanyDetails(d); setNewCompanyName(`Copy of ${d.name}`); }).catch(console.error);
    }, [apiFetch, selectedCompany]);

    useEffect(() => { if (!ccSourceOrg) { setCcCompanies([]); setCcSelectedCompany(''); return; } apiFetch(`/api/data/companies?org_id=${ccSourceOrg}`).then(r => r.json()).then(setCcCompanies).catch(console.error); setCcSelectedCompany(''); }, [apiFetch, ccSourceOrg]);
    useEffect(() => { if (!ccSelectedCompany) { setCcNewName(''); return; } const co = ccCompanies.find(c => String(c.id) === String(ccSelectedCompany)); if (co) setCcNewName(`Copy of ${co.name}`); }, [ccSelectedCompany, ccCompanies]);

    // ── SSE reader ──
    const readSSE = async (response, eventCollector = []) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.slice(6));
                        eventCollector.push(data);
                        if (typeof data?.message === 'string' && /\b(502|503|504)\b|bad gateway|service temporarily unavailable|gateway timeout/i.test(data.message)) {
                            setToastMessage('Please check your business demo and retry after some time.');
                        }
                        if (data.type === 'steps') {
                            const init = JSON.parse(data.message).map(s => ({ ...s, status: 'pending' }));
                            stepsRef.current = init;
                            setSteps(init);
                        } else if (data.type === 'step') {
                            const sd = JSON.parse(data.message);
                            setSteps(prev => {
                                const u = prev.map(s => s.id === sd.stepId ? { ...s, status: sd.status, error: sd.error, duration: sd.duration } : s);
                                stepsRef.current = u;
                                return u;
                            });
                        } else if (data.type === 'run-id') {
                            setCurrentRunId(data.message);
                        } else {
                            setLogs(prev => [...prev, data]);
                        }
                    } catch {}
                }
            }
        } catch (err) { if (err.name !== 'AbortError') throw err; }
    };

    // ── Get client-side step definitions for immediate display ──
    const getClientSteps = (modeId) => {
        if (modeId === 'org') return STEP_DEFS.org;
        if (modeId === 'company') return STEP_DEFS.company;
        if (modeId === 'user') return STEP_DEFS.user;
        if (modeId === 'bulk-users-sheet') return STEP_DEFS.bulkUsersSheet;
        if (modeId === 'inventory-permissions') return STEP_DEFS.inventoryPermissions;
        const nav = NAV_ITEMS.find(n => n.id === modeId);
        if (nav?.scriptKey && STEP_DEFS[nav.scriptKey]) return STEP_DEFS[nav.scriptKey];
        return null;
    };

    const initSteps = (modeId) => {
        const defs = getClientSteps(modeId);
        if (defs) {
            const init = defs.map(s => ({ ...s, status: 'pending' }));
            stepsRef.current = init;
            setSteps(init);
        }
    };

    const getUsername = () => currentUser?.name || 'Unknown';
    const getUserEmail = () => currentUser?.email || null;

    const trimText = (value) => (typeof value === 'string' ? value.trim() : value);
    const serializeSteps = () => stepsRef.current.map((s) => ({
        id: s.id,
        label: s.label,
        status: s.status,
        error: s.error || null,
        duration: s.duration || null,
    }));
    const getResultMessage = (events) => {
        const success = [...events].reverse().find((e) => e.type === 'success');
        if (success?.message) return success.message;
        const error = [...events].reverse().find((e) => e.type === 'error');
        return error?.message || null;
    };

    // ── Handlers ──
    const handleStop = async () => {
        try {
            await apiFetch('/api/replicate/stop', { method: 'POST' });
            abortRef.current?.abort(); abortRef.current = null; startingRef.current = false;
            setLogs(prev => [...prev, { type: 'error', message: 'Process stopped by user.', timestamp: new Date().toISOString() }]);
            setSteps(prev => {
                const u = prev.map(s => s.status === 'running' ? { ...s, status: 'failed', error: 'Process stopped by user' } : s);
                stepsRef.current = u;
                return u;
            });
            if (currentRunId) {
                updateHistoryRun(currentRunId, {
                    status: 'paused',
                    endedAt: new Date().toISOString(),
                    steps: serializeSteps(),
                    events: logs,
                });
            }
        } catch (err) { console.error(err); }
        finally { setIsRunning(false); setIsPaused(true); }
    };

    const handleCopyOrg = async (resumeFromStep = null) => {
        if (!selectedOrg || !newOrgName) return;
        const ctrl = new AbortController(); abortRef.current = ctrl;
        setIsRunning(true); setIsPaused(false); setRunStartTime(new Date());
        if (!resumeFromStep) {
            setLogs([{ type: 'progress', message: 'Starting org replication...', timestamp: new Date().toISOString() }]);
            initSteps('org');
        }
        const params = {
            sourceOrgId: selectedOrg,
            sourceCompanyId: selectedCompany || undefined,
            newOrgName: trimText(newOrgName),
            newDomainUrl: trimText(newDomainUrl),
            newCompanyName: companyDetails ? trimText(newCompanyName) : undefined,
        };
        setLastRunParams(params);
        const runId = currentRunId || `run-${Date.now()}`;
        setCurrentRunId(runId);
        addToHistory({
            id: runId,
            label: params.newOrgName || `Org ${selectedOrg}`,
            status: 'running',
            startedAt: new Date().toISOString(),
            mode: 'org',
            user: getUsername(),
            userEmail: getUserEmail(),
            request: {
                sourceOrgId: params.sourceOrgId,
                sourceCompanyId: params.sourceCompanyId,
                newOrgName: params.newOrgName,
                newDomainUrl: params.newDomainUrl,
                newCompanyName: params.newCompanyName,
                resumedFromStep: resumeFromStep || null,
            },
        });
        setActiveHistoryId(runId);
        const runEvents = [];
        try {
            const res = await apiFetch('/api/replicate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...params, ...(resumeFromStep ? { resumeFromStep, runId } : {}) }), signal: ctrl.signal });
            await readSSE(res, runEvents);
            const hasFailed = stepsRef.current.some(s => s.status === 'failed');
            updateHistoryRun(runId, {
                status: hasFailed ? 'failed' : 'completed',
                endedAt: new Date().toISOString(),
                steps: serializeSteps(),
                events: runEvents,
                resultMessage: getResultMessage(runEvents),
            });
            if (hasFailed) setIsPaused(true);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setLogs(prev => [...prev, { type: 'error', message: `Connection error: ${err.message}`, timestamp: new Date().toISOString() }]);
                updateHistoryRun(runId, { status: 'failed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: err.message });
                setIsPaused(true);
            }
        } finally { abortRef.current = null; startingRef.current = false; setIsRunning(false); }
    };

    const handleCopyCompany = async () => {
        if (!ccDestOrg || !ccSelectedCompany || !ccNewName) return;
        const ctrl = new AbortController(); abortRef.current = ctrl;
        setIsRunning(true); setIsPaused(false); setRunStartTime(new Date());
        setLogs([{ type: 'progress', message: 'Starting company replication...', timestamp: new Date().toISOString() }]);
        initSteps('company');
        const params = {
            targetOrgId: trimText(ccDestOrg),
            sourceCompanyId: trimText(ccSelectedCompany),
            newCompanyName: trimText(ccNewName),
        };
        const runId = `run-${Date.now()}`;
        setCurrentRunId(runId);
        addToHistory({
            id: runId,
            label: params.newCompanyName,
            status: 'running',
            startedAt: new Date().toISOString(),
            mode: 'company',
            user: getUsername(),
            userEmail: getUserEmail(),
            request: params,
        });
        setActiveHistoryId(runId);
        const runEvents = [];
        try {
            const res = await apiFetch('/api/replicate/company', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...params, runId }), signal: ctrl.signal });
            await readSSE(res, runEvents);
            const hasFailed = stepsRef.current.some(s => s.status === 'failed');
            updateHistoryRun(runId, { status: hasFailed ? 'failed' : 'completed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: getResultMessage(runEvents) });
        } catch (err) {
            if (err.name !== 'AbortError') { setLogs(prev => [...prev, { type: 'error', message: `Connection error: ${err.message}`, timestamp: new Date().toISOString() }]); updateHistoryRun(runId, { status: 'failed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: err.message }); }
        } finally { abortRef.current = null; startingRef.current = false; setIsRunning(false); }
    };

    const handleCreateUser = async () => {
        if (!cuBaseUrl || !cuEmail || !cuPassword || !cuCompanyId || !cuName || !cuCount) return;
        const ctrl = new AbortController(); abortRef.current = ctrl;
        setIsRunning(true); setIsPaused(false); setRunStartTime(new Date());
        setLogs([{ type: 'progress', message: `Creating ${cuCount} user(s)...`, timestamp: new Date().toISOString() }]);
        initSteps('user');
        const params = {
            baseUrl: trimText(cuBaseUrl),
            email: trimText(cuEmail),
            password: trimText(cuPassword),
            companyId: trimText(cuCompanyId),
            name: trimText(cuName),
            numberOfUsers: Number(cuCount),
        };
        const runId = `run-${Date.now()}`;
        setCurrentRunId(runId);
        addToHistory({
            id: runId,
            label: `${params.numberOfUsers} Users`,
            status: 'running',
            startedAt: new Date().toISOString(),
            mode: 'user',
            user: getUsername(),
            userEmail: getUserEmail(),
            request: { ...params, password: '********' },
        });
        setActiveHistoryId(runId);
        const runEvents = [];
        try {
            const res = await apiFetch('/api/replicate/create-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...params, runId }), signal: ctrl.signal });
            await readSSE(res, runEvents);
            const hasFailed = stepsRef.current.some(s => s.status === 'failed');
            updateHistoryRun(runId, { status: hasFailed ? 'failed' : 'completed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: getResultMessage(runEvents) });
        } catch (err) {
            if (err.name !== 'AbortError') { setLogs(prev => [...prev, { type: 'error', message: `Connection error: ${err.message}`, timestamp: new Date().toISOString() }]); updateHistoryRun(runId, { status: 'failed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: err.message }); }
        } finally { abortRef.current = null; startingRef.current = false; setIsRunning(false); }
    };

    const handleInventoryPermissions = async () => {
        const selectedProducts = Object.entries(ipProducts)
            .filter(([, enabled]) => !!enabled)
            .map(([key]) => key);

        if (!ipClientCompanyId.trim() || !ipVendorCompanyIds.trim() || selectedProducts.length === 0) return;

        const vendorCompanyIds = ipVendorCompanyIds
            .split(',')
            .map(v => v.trim())
            .filter(Boolean);

        const ctrl = new AbortController(); abortRef.current = ctrl;
        setIsRunning(true); setIsPaused(false); setRunStartTime(new Date());
        setLogs([{ type: 'progress', message: 'Starting inventory permission flow...', timestamp: new Date().toISOString() }]);
        initSteps('inventory-permissions');

        const params = {
            clientCompanyId: trimText(ipClientCompanyId),
            vendorCompanyIds,
            createApiClient: !!ipCreateApiClient,
            products: selectedProducts,
        };

        const runId = `run-${Date.now()}`;
        setCurrentRunId(runId);
        addToHistory({
            id: runId,
            label: `Inventory Permissions (${params.clientCompanyId})`,
            status: 'running',
            startedAt: new Date().toISOString(),
            mode: 'inventory-permissions',
            user: getUsername(),
            userEmail: getUserEmail(),
            request: params,
        });
        setActiveHistoryId(runId);

        const runEvents = [];
        try {
            const res = await apiFetch('/api/replicate/inventory-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...params, runId }),
                signal: ctrl.signal,
            });
            await readSSE(res, runEvents);
            const hasFailed = stepsRef.current.some(s => s.status === 'failed');
            updateHistoryRun(runId, { status: hasFailed ? 'failed' : 'completed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: getResultMessage(runEvents) });
        } catch (err) {
            if (err.name !== 'AbortError') { setLogs(prev => [...prev, { type: 'error', message: `Connection error: ${err.message}`, timestamp: new Date().toISOString() }]); updateHistoryRun(runId, { status: 'failed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: err.message }); }
        } finally { abortRef.current = null; startingRef.current = false; setIsRunning(false); }
    };

    const handleRunScript = async () => {
        if (abortRef.current) return;
        const navItem = NAV_ITEMS.find(n => n.id === mode);
        if (!navItem?.scriptKey) return;
        const config = SCRIPT_FIELDS[navItem.scriptKey];
        if (!config) return;
        const currentScope = scriptValues._scope || 'org';
        const sourceScope = scriptValues._sourceScope || 'org';
        const targetScope = scriptValues._targetScope || 'org';
        const activeFields = config.dualScopeSelector
            ? [
                { key: 'sourceId', label: sourceScope === 'company' ? 'Source Company ID' : 'Source Org ID', placeholder: '' },
                { key: 'targetId', label: targetScope === 'company' ? 'Target Company ID' : 'Target Org ID', placeholder: '' },
            ]
            : config.scopeSelector
            ? (config.fieldsByScope?.[currentScope] || config.fields)
            : config.fields;
        const hasUploadedSheet = navItem.scriptKey === 'importCustomSearchMenusFromSheet'
            && !!scriptValues?.xlsxFileUpload?.contentBase64;
        if (!activeFields.every((f) => {
            if (f.required === false) return true;
            if (navItem.scriptKey === 'importCustomSearchMenusFromSheet' && f.key === 'xlsxPath' && hasUploadedSheet) return true;
            return (scriptValues[f.key] || '').trim();
        })) return;
        const args = activeFields
            .map((f) => {
                if (navItem.scriptKey === 'importCustomSearchMenusFromSheet' && f.key === 'xlsxPath' && hasUploadedSheet) {
                    return '__UPLOADED_FILE__';
                }
                return (scriptValues[f.key] || '').trim();
            })
            .filter((value, idx) => {
                const field = activeFields[idx];
                if (field.required === false) return !!value;
                return true;
            });
        if (navItem.scriptKey === 'copyCustomizations') {
            const selectedSections = Array.isArray(scriptValues._customizationTypes)
                ? scriptValues._customizationTypes
                : ['global', 'custom_texts', 'json_navigation_menu'];
            const sectionsCsv = selectedSections.join(',');
            const sourceId = args[0];
            const targetId = args[1];
            args.length = 0;
            args.push(currentScope, sourceId, targetId, sectionsCsv);
        } else if (navItem.scriptKey === 'copyCustomDataAndValues') {
            const selectedSections = Array.isArray(scriptValues._customDataSections)
                ? scriptValues._customDataSections
                : ['headers', 'values'];
            const sourceCompanyId = args[0];
            const targetCompanyId = args[1];
            const sectionsCsv = selectedSections.join(',');
            args.length = 0;
            args.push(sourceCompanyId, targetCompanyId, sectionsCsv);
        } else if (config.dualScopeSelector) {
            args.push(sourceScope, targetScope);
        } else if (config.scopeSelector) {
            args.push(currentScope);
        }
        const ctrl = new AbortController(); abortRef.current = ctrl;
        setIsRunning(true); setIsPaused(false); setRunStartTime(new Date());
        setLogs([{ type: 'progress', message: `Running script: ${navItem.scriptKey}...`, timestamp: new Date().toISOString() }]);
        initSteps(mode);
        const runId = `run-${Date.now()}`;
        setCurrentRunId(runId);
        addToHistory({
            id: runId,
            label: config.title || navItem.scriptKey,
            status: 'running',
            startedAt: new Date().toISOString(),
            mode: 'script',
            user: getUsername(),
            userEmail: getUserEmail(),
            request: {
                script: navItem.scriptKey,
                args: args.map((a) => (a === '__UPLOADED_FILE__' ? '[uploaded-xlsx]' : a)),
            },
        });
        setActiveHistoryId(runId);
        const runEvents = [];
        try {
            const res = await apiFetch('/api/replicate/run-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script: navItem.scriptKey,
                    args,
                    fileUpload: hasUploadedSheet ? scriptValues.xlsxFileUpload : null,
                    runId,
                }),
                signal: ctrl.signal,
            });
            await readSSE(res, runEvents);
            const hasFailed = stepsRef.current.some(s => s.status === 'failed');
            updateHistoryRun(runId, { status: hasFailed ? 'failed' : 'completed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: getResultMessage(runEvents) });
        } catch (err) {
            if (err.name !== 'AbortError') { setLogs(prev => [...prev, { type: 'error', message: `Connection error: ${err.message}`, timestamp: new Date().toISOString() }]); updateHistoryRun(runId, { status: 'failed', endedAt: new Date().toISOString(), steps: serializeSteps(), events: runEvents, resultMessage: err.message }); }
        } finally { abortRef.current = null; startingRef.current = false; setIsRunning(false); }
    };

    const handleBulkUsersValidateOnly = async () => {
        if (!bulkUserFile) {
            setToastMessage('Select a spreadsheet first.');
            return;
        }
        const fd = new FormData();
        fd.append('file', bulkUserFile, bulkUserFile.name);
        if (bulkUserSheetName.trim()) fd.append('sheetName', bulkUserSheetName.trim());
        setBulkUsersValidating(true);
        try {
            const res = await apiFetch('/api/bulk-users/parse', { method: 'POST', body: fd });
            const data = await res.json().catch(() => ({ ok: false, message: 'Invalid JSON response' }));
            const logSummary = data.ok
                ? `Validated sheet "${data.usedSheet || '—'}": ${data.preparedCount ?? 0} ready, ${data.skippedCount ?? 0} skipped, ${data.rowCount ?? 0} data rows.`
                : (data.message || 'Validation failed.');
            setLogs([{
                type: data.ok ? 'success' : 'error',
                message: logSummary,
                timestamp: new Date().toISOString(),
            }]);
            if (data.ok) {
                setBulkPreparedPayload({
                    prepared: data.prepared,
                    skipped: data.skipped || [],
                    usedSheet: data.usedSheet,
                    sheetNames: data.sheetNames || [],
                });
                setBulkResume({ startIndex: 0, usernameOverrides: {} });
                setBulkValidationUsernames({
                    dbUsernameConflicts: data.dbUsernameConflicts || [],
                    internalDuplicates: data.internalDuplicates || [],
                });
                const dup = data.internalDuplicates?.length ? ` ${data.internalDuplicates.length} duplicate username(s) in sheet.` : '';
                const dbC = data.dbUsernameConflicts?.length ? ` ${data.dbUsernameConflicts.length} username(s) already in DB.` : '';
                if (dup || dbC) setToastMessage(`Parsed.${dup}${dbC} Fix sheet or use conflict flow on run.`);
            } else {
                setBulkValidationUsernames(null);
                setToastMessage(data.message || 'Validation failed');
            }
        } catch (err) {
            setBulkValidationUsernames(null);
            setLogs([{ type: 'error', message: err.message || String(err), timestamp: new Date().toISOString() }]);
            setToastMessage('Validation request failed.');
        } finally {
            setBulkUsersValidating(false);
        }
    };

    const handleBulkDownloadCsv = useCallback(() => {
        if (!bulkLastCreatedCsv) return;
        const blob = new Blob([bulkLastCreatedCsv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-users-created-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [bulkLastCreatedCsv]);

    /**
     * @param {null | { startIndex: number, usernameOverrides: Record<string, string> }} resumeSnapshot — pass after username-conflict resume (avoids stale state).
     */
    const handleBulkUsersSheetRun = async (resumeSnapshot = null) => {
        const hasFile = !!bulkUserFile;
        const useJson = Array.isArray(bulkPreparedPayload?.prepared) && bulkPreparedPayload.prepared.length > 0;
        if (!hasFile && !useJson) return;

        const effectiveResume = resumeSnapshot || bulkResume;

        const continuingBulkJob =
            resumeSnapshot != null ||
            Number(effectiveResume.startIndex) > 0 ||
            Object.keys(effectiveResume.usernameOverrides || {}).length > 0;
        if (!continuingBulkJob) {
            setBulkLastCreatedCsv('');
        }

        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setIsRunning(true);
        setIsPaused(false);
        setRunStartTime(new Date());
        setLogs([{ type: 'progress', message: useJson ? 'Bulk create (JSON / resume)…' : 'Bulk create (upload + parse on server)…', timestamp: new Date().toISOString() }]);
        initSteps('bulk-users-sheet');
        setSteps((prev) => {
            const u = prev.map((s) => ({ ...s, status: 'running' }));
            stepsRef.current = u;
            return u;
        });

        const runId = `run-${Date.now()}`;
        setCurrentRunId(runId);
        addToHistory({
            id: runId,
            label: `Bulk users: ${useJson ? bulkPreparedPayload.usedSheet || 'sheet' : bulkUserFile?.name || 'run'}`,
            status: 'running',
            startedAt: new Date().toISOString(),
            mode: 'bulk-users-sheet',
            user: getUsername(),
            userEmail: getUserEmail(),
            request: {
                mode: useJson ? 'json' : 'multipart',
                startIndex: effectiveResume.startIndex,
                usernameOverrides: Object.keys(effectiveResume.usernameOverrides || {}).length ? effectiveResume.usernameOverrides : undefined,
                verifyEmail: bulkVerifyEmailAfterCreate,
            },
        });
        setActiveHistoryId(runId);

        try {
            let res;
            if (useJson) {
                res = await apiFetch('/api/bulk-users/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prepared: bulkPreparedPayload.prepared,
                        skipped: bulkPreparedPayload.skipped || [],
                        usedSheet: bulkPreparedPayload.usedSheet,
                        sheetNames: bulkPreparedPayload.sheetNames || [],
                        startIndex: effectiveResume.startIndex,
                        usernameOverrides: effectiveResume.usernameOverrides || {},
                        verifyEmail: bulkVerifyEmailAfterCreate,
                    }),
                    signal: ctrl.signal,
                });
            } else {
                const fd = new FormData();
                fd.append('file', bulkUserFile, bulkUserFile.name);
                if (bulkUserSheetName.trim()) fd.append('sheetName', bulkUserSheetName.trim());
                fd.append('verifyEmail', bulkVerifyEmailAfterCreate ? 'true' : 'false');
                res = await apiFetch('/api/bulk-users/run', {
                    method: 'POST',
                    body: fd,
                    signal: ctrl.signal,
                });
            }

            const data = await res.json().catch(() => ({ ok: false, message: 'Invalid JSON response' }));

            if (res.status === 409 && data.code === 'USERNAME_CONFLICT') {
                setBulkPreparedPayload((prev) => ({
                    prepared: data.prepared || prev?.prepared,
                    skipped: prev?.skipped || data.skipped || [],
                    usedSheet: data.usedSheet || prev?.usedSheet || '',
                    sheetNames: data.sheetNames?.length ? data.sheetNames : (prev?.sheetNames || []),
                }));
                setBulkResume((prev) => ({
                    ...prev,
                    startIndex: Number(data.nextIndex) || 0,
                }));
                if (data?.createdUsersCsv) {
                    setBulkLastCreatedCsv((prev) => mergeBulkCreatedUsersCsv(prev, data.createdUsersCsv));
                }
                setBulkConflictReplacementUsername('');
                setBulkUsernameConflictModal({
                    sheetRow: data.sheetRow,
                    username: data.username,
                    companyId: data.companyId,
                    orgId: data.orgId,
                    existingUserId: data.existingUserId,
                    existingCompanyId: data.existingCompanyId,
                });
                setSteps((prev) => {
                    const u = prev.map((s) => ({
                        ...s,
                        status: 'pending',
                        error: `Username "${data.username}" already exists (row ${data.sheetRow}). Enter a new username below.`,
                    }));
                    stepsRef.current = u;
                    return u;
                });
                setLogs([
                    { type: 'error', message: data.message || 'USERNAME_CONFLICT', timestamp: new Date().toISOString() },
                    { type: 'progress', message: JSON.stringify(data, null, 2), timestamp: new Date().toISOString() },
                ]);
                updateHistoryRun(runId, {
                    status: 'paused',
                    endedAt: new Date().toISOString(),
                    steps: serializeSteps(),
                    resultMessage: data.message,
                });
                setIsPaused(true);
                setToastMessage(`Row ${data.sheetRow}: username taken. Enter a new username to resume.`);
                return;
            }

            const httpOk = res.ok;
            const payloadOk = data.ok !== false;
            const successCount = Number(data.successCount) || 0;
            const failCount = Number(data.failCount) || 0;
            const stepFailed = !httpOk || !payloadOk || (successCount === 0 && failCount > 0);
            const stepError = failCount > 0
                ? `${failCount} row(s) failed${successCount > 0 ? `, ${successCount} ok` : ''}`
                : (!payloadOk ? (data.message || 'Error') : null);

            const usernameConflictCodes = new Set(['USERNAME_EXISTS', 'USERNAME_DUPLICATE_IN_BATCH']);
            const usernameConflictResults = (data.results || []).filter(
                (r) => r.status === 'error' && usernameConflictCodes.has(r.code)
            );
            /** Resume needs parsed payload + Sheet row → usernameOverrides (multipart-only runs cannot resume). */
            const canResumeUsernameConflicts = useJson && Array.isArray(bulkPreparedPayload?.prepared);
            if (httpOk && payloadOk && usernameConflictResults.length > 0 && canResumeUsernameConflicts) {
                const sorted = [...usernameConflictResults].sort((a, b) => a.sheetRow - b.sheetRow);
                const first = sorted[0];
                const prepared = bulkPreparedPayload.prepared;
                const resumeStart = prepared.findIndex((p) => p.sheetRow === first.sheetRow);
                const startIdx = resumeStart >= 0 ? resumeStart : 0;
                const prepRow = prepared[startIdx];
                const keepOverrides = successCount > 0 ? { ...(effectiveResume.usernameOverrides || {}) } : {};
                setBulkResume({
                    startIndex: startIdx,
                    usernameOverrides: keepOverrides,
                });
                if (data.createdUsersCsv) {
                    setBulkLastCreatedCsv((prev) => mergeBulkCreatedUsersCsv(prev, data.createdUsersCsv));
                }
                setBulkConflictReplacementUsername('');
                setBulkUsernameConflictModal({
                    sheetRow: first.sheetRow,
                    username: first.username,
                    companyId: prepRow?.companyId,
                    orgId: prepRow?.orgId,
                    existingUserId: first.existingUserId,
                    existingCompanyId: first.existingCompanyId,
                });
                setSteps((prev) => {
                    const u = prev.map((s) => ({
                        ...s,
                        status: 'pending',
                        error: `Username "${first.username}" conflict (row ${first.sheetRow}). Enter a new username below.`,
                    }));
                    stepsRef.current = u;
                    return u;
                });
                setLogs([
                    { type: 'error', message: first.message || 'Username conflict', timestamp: new Date().toISOString() },
                    { type: 'progress', message: JSON.stringify(data, null, 2), timestamp: new Date().toISOString() },
                ]);
                updateHistoryRun(runId, {
                    status: 'paused',
                    endedAt: new Date().toISOString(),
                    steps: serializeSteps(),
                    resultMessage: first.message || 'Username conflict — enter a new username to resume.',
                });
                setIsPaused(true);
                setToastMessage(`Row ${first.sheetRow}: username conflict. Enter a new username to resume.`);
                return;
            }

            if (usernameConflictResults.length > 0 && !canResumeUsernameConflicts) {
                setToastMessage(
                    'Username conflict: use "Validate sheet (parse + DB checks)" first, then Start — that enables change username & resume.'
                );
            }

            if (data.createdUsersCsv) {
                setBulkLastCreatedCsv((prev) => mergeBulkCreatedUsersCsv(prev, data.createdUsersCsv));
            }
            setBulkResume({ startIndex: 0, usernameOverrides: {} });

            setSteps((prev) => {
                const u = prev.map((s) => ({
                    ...s,
                    status: stepFailed ? 'failed' : 'completed',
                    error: stepFailed ? (stepError || data.message || 'Run failed') : (failCount > 0 ? stepError : null),
                }));
                stepsRef.current = u;
                return u;
            });
            const summary = JSON.stringify(data, null, 2);
            setLogs([
                { type: 'progress', message: 'Run finished.', timestamp: new Date().toISOString() },
                { type: stepFailed ? 'error' : 'success', message: summary, timestamp: new Date().toISOString() },
            ]);
            const historyStatus = stepFailed && successCount === 0 ? 'failed' : 'completed';
            updateHistoryRun(runId, {
                status: historyStatus,
                endedAt: new Date().toISOString(),
                steps: serializeSteps(),
                resultMessage: data.successCount != null
                    ? `Created ${successCount}, failed ${failCount}`
                    : (data.message || null),
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                setLogs((prev) => [...prev, { type: 'error', message: `Connection error: ${err.message}`, timestamp: new Date().toISOString() }]);
                setSteps((prev) => {
                    const u = prev.map((s) => ({ ...s, status: 'failed', error: err.message }));
                    stepsRef.current = u;
                    return u;
                });
                updateHistoryRun(runId, { status: 'failed', endedAt: new Date().toISOString(), steps: serializeSteps(), resultMessage: err.message });
            }
        } finally {
            abortRef.current = null;
            startingRef.current = false;
            setIsRunning(false);
        }
    };

    const handleBulkUsernameConflictResume = () => {
        if (!bulkUsernameConflictModal || !bulkConflictReplacementUsername.trim()) {
            setToastMessage('Enter a new username.');
            return;
        }
        const rowKey = String(bulkUsernameConflictModal.sheetRow);
        const snapshot = {
            startIndex: bulkResume.startIndex,
            usernameOverrides: {
                ...bulkResume.usernameOverrides,
                [rowKey]: bulkConflictReplacementUsername.trim(),
            },
        };
        setBulkResume(snapshot);
        setBulkUsernameConflictModal(null);
        setBulkConflictReplacementUsername('');
        handleBulkUsersSheetRun(snapshot);
    };

    const executeStartRef = useRef(null);
    executeStartRef.current = () => {
        switch (mode) {
            case 'org': handleCopyOrg(); break;
            case 'company': handleCopyCompany(); break;
            case 'user': handleCreateUser(); break;
            case 'bulk-users-sheet': handleBulkUsersSheetRun(); break;
            case 'inventory-permissions': handleInventoryPermissions(); break;
            default: handleRunScript(); break;
        }
    };

    const handleStart = () => {
        if (isRunning || startingRef.current) return;
        startingRef.current = true;
        executeStartRef.current();
    };

    const handleResume = (stepId) => { if (lastRunParams) handleCopyOrg(stepId); };
    const handleRetry = (stepId) => {
        if (!lastRunParams) return;
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'pending', error: null } : s));
        handleCopyOrg(stepId);
    };
    const handleSkip = (stepId) => {
        setSteps(prev => {
            const u = prev.map(s => s.id === stepId ? { ...s, status: 'skipped', error: null } : s);
            const idx = u.findIndex(s => s.id === stepId);
            if (idx < u.length - 1 && u[idx + 1].status === 'pending') handleCopyOrg(u[idx + 1].id);
            return u;
        });
    };

    const switchMode = (nextMode) => {
        if (isRunning) return;
        if (mode === 'bulk-users-sheet' && nextMode !== 'bulk-users-sheet') {
            setBulkUserFile(null);
            setBulkPreparedPayload(null);
            setBulkResume({ startIndex: 0, usernameOverrides: {} });
            setBulkLastCreatedCsv('');
            setBulkUsernameConflictModal(null);
            setBulkConflictReplacementUsername('');
            setBulkValidationUsernames(null);
        }
        setMode(nextMode); setLogs([]); setSteps([]); setIsPaused(false); setScriptValues({});
    };

    const handleDeleteRun = (runId) => {
        setRunHistory(prev => prev.filter(r => r.id !== runId));
        apiFetch(`/api/history/${runId}`, { method: 'DELETE' }).catch(() => {});
        if (activeHistoryId === runId) setActiveHistoryId(null);
    };

    // ── Derived state ──
    const activeNavItem = NAV_ITEMS.find(n => n.id === mode);
    const ActiveIcon = activeNavItem?.icon || Building2;
    const allowStepControls = mode === 'org';
    const allowStopExecution = true;
    const hasFailedStep = steps.some(s => s.status === 'failed');
    const allStepsComplete = steps.length > 0 && steps.every(s => s.status === 'completed' || s.status === 'skipped');
    const latestLog = logs.length ? logs[logs.length - 1] : null;
    const overallStatus = isRunning ? 'running' : hasFailedStep ? 'failed' : allStepsComplete ? 'completed' : latestLog?.type === 'error' ? 'failed' : latestLog?.type === 'success' ? 'completed' : 'idle';

    const canStart = (() => {
        if (isRunning) return false;
        switch (mode) {
            case 'org': return !!selectedOrg && !!newOrgName.trim();
            case 'company': return !!ccDestOrg && !!ccSelectedCompany && !!ccNewName.trim();
            case 'user': return !!(cuBaseUrl.trim() && cuEmail.trim() && cuPassword.trim() && cuCompanyId.trim() && cuName.trim() && Number(cuCount) > 0);
            case 'bulk-users-sheet': return !!(bulkUserFile || (bulkPreparedPayload?.prepared?.length > 0));
            case 'inventory-permissions': {
                const vendorIds = ipVendorCompanyIds.split(',').map(v => v.trim()).filter(Boolean);
                const hasProduct = Object.values(ipProducts).some(Boolean);
                return !!ipClientCompanyId.trim() && vendorIds.length > 0 && hasProduct;
            }
            default: {
                const nav = NAV_ITEMS.find(n => n.id === mode);
                if (!nav?.scriptKey) return false;
                const cfg = SCRIPT_FIELDS[nav.scriptKey];
                if (!cfg) return false;
                const scopeVal = scriptValues._scope || 'org';
                const sourceScope = scriptValues._sourceScope || 'org';
                const targetScope = scriptValues._targetScope || 'org';
                const fields = cfg.dualScopeSelector
                    ? [
                        { key: 'sourceId' },
                        { key: 'targetId' },
                    ]
                    : cfg.scopeSelector
                    ? (cfg.fieldsByScope?.[scopeVal] || cfg.fields)
                    : cfg.fields;
                const hasUploadedSheet = nav.scriptKey === 'importCustomSearchMenusFromSheet'
                    && !!scriptValues?.xlsxFileUpload?.contentBase64;
                const requiredFieldsFilled = fields.every((f) => {
                    if (f.required === false) return true;
                    if (nav.scriptKey === 'importCustomSearchMenusFromSheet' && f.key === 'xlsxPath' && hasUploadedSheet) return true;
                    return (scriptValues[f.key] || '').trim();
                });
                if (!requiredFieldsFilled) return false;
                if (nav.scriptKey === 'copyCustomizations') {
                    const selectedSections = Array.isArray(scriptValues._customizationTypes)
                        ? scriptValues._customizationTypes
                        : ['global', 'custom_texts', 'json_navigation_menu'];
                    return selectedSections.length > 0;
                }
                if (nav.scriptKey === 'copyCustomDataAndValues') {
                    const selectedSections = Array.isArray(scriptValues._customDataSections)
                        ? scriptValues._customDataSections
                        : ['headers', 'values'];
                    return selectedSections.length > 0;
                }
                return true;
            }
        }
    })();

    // ── Render form for current mode ──
    const renderForm = () => {
        const disabled = isRunning;
        switch (mode) {
            case 'org':
                return <OrgForm orgs={orgs} companies={companies} selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg} selectedCompany={selectedCompany} setSelectedCompany={setSelectedCompany} orgDetails={orgDetails} companyDetails={companyDetails} newOrgName={newOrgName} setNewOrgName={setNewOrgName} newDomainUrl={newDomainUrl} setNewDomainUrl={setNewDomainUrl} newCompanyName={newCompanyName} setNewCompanyName={setNewCompanyName} disabled={disabled} />;
            case 'company':
                return <CompanyForm orgs={orgs} ccSourceOrg={ccSourceOrg} setCcSourceOrg={setCcSourceOrg} ccCompanies={ccCompanies} ccSelectedCompany={ccSelectedCompany} setCcSelectedCompany={setCcSelectedCompany} ccDestOrg={ccDestOrg} setCcDestOrg={setCcDestOrg} ccNewName={ccNewName} setCcNewName={setCcNewName} disabled={disabled} />;
            case 'user':
                return <UserForm cuBaseUrl={cuBaseUrl} setCuBaseUrl={setCuBaseUrl} cuEmail={cuEmail} setCuEmail={setCuEmail} cuPassword={cuPassword} setCuPassword={setCuPassword} cuCompanyId={cuCompanyId} setCuCompanyId={setCuCompanyId} cuName={cuName} setCuName={setCuName} cuCount={cuCount} setCuCount={setCuCount} disabled={disabled} />;
            case 'bulk-users-sheet':
                return (
                    <BulkUsersSheetForm
                        bulkUserFile={bulkUserFile}
                        setBulkUserFile={handleBulkUserFileChange}
                        bulkUserSheetName={bulkUserSheetName}
                        setBulkUserSheetName={setBulkUserSheetName}
                        disabled={disabled}
                        onValidateOnly={handleBulkUsersValidateOnly}
                        validating={bulkUsersValidating}
                        hasValidatedPayload={!!bulkPreparedPayload?.prepared?.length}
                        validationUsernames={bulkValidationUsernames}
                        verifyEmailAfterCreate={bulkVerifyEmailAfterCreate}
                        setVerifyEmailAfterCreate={setBulkVerifyEmailAfterCreate}
                        lastCreatedUsersCsv={bulkLastCreatedCsv}
                        onDownloadCsv={handleBulkDownloadCsv}
                    />
                );
            case 'inventory-permissions':
                return (
                    <InventoryPermissionForm
                        ipClientCompanyId={ipClientCompanyId}
                        setIpClientCompanyId={setIpClientCompanyId}
                        ipVendorCompanyIds={ipVendorCompanyIds}
                        setIpVendorCompanyIds={setIpVendorCompanyIds}
                        ipCreateApiClient={ipCreateApiClient}
                        setIpCreateApiClient={setIpCreateApiClient}
                        ipProducts={ipProducts}
                        setIpProducts={setIpProducts}
                        disabled={disabled}
                    />
                );
            default:
                return <ScriptForm mode={mode} scriptValues={scriptValues} setScriptValues={setScriptValues} disabled={disabled} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} items={NAV_ITEMS} activeId={mode} onSelect={switchMode} disabled={isRunning} />

            <div className="flex h-screen">
                <LeftPanel
                    activeNavItem={activeNavItem} ActiveIcon={ActiveIcon} mode={mode}
                    isRunning={isRunning} canStart={canStart} dbStatus={dbStatus}
                    canStopExecution={allowStopExecution}
                    historyOpen={historyOpen} setHistoryOpen={setHistoryOpen}
                    onOpenSidebar={() => setSidebarOpen(true)} onStart={handleStart} onStop={handleStop}
                    runHistory={runHistory} activeHistoryId={activeHistoryId}
                    onSelectRun={setActiveHistoryId} onDeleteRun={handleDeleteRun}
                >
                    {renderForm()}
                </LeftPanel>

                <MainContent
                    activeNavItem={activeNavItem} ActiveIcon={ActiveIcon}
                    isRunning={isRunning} dbStatus={dbStatus}
                    steps={steps} logs={logs} overallStatus={overallStatus}
                    runStartTime={runStartTime} selectedOrg={selectedOrg}
                    onResume={allowStepControls ? handleResume : undefined}
                    onRetry={allowStepControls ? handleRetry : undefined}
                    onSkip={allowStepControls ? handleSkip : undefined}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    currentUserEmail={currentUser?.email}
                    onLogout={handleLogout}
                />
            </div>

            {bulkUsernameConflictModal && mode === 'bulk-users-sheet' && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
                        <h3 className="text-sm font-semibold text-slate-900">Username already exists</h3>
                        <p className="mt-2 text-xs text-slate-600">
                            Row <strong>{bulkUsernameConflictModal.sheetRow}</strong>:{' '}
                            <code className="rounded bg-slate-100 px-1">{bulkUsernameConflictModal.username}</code>{' '}
                            already exists
                            {(bulkUsernameConflictModal.existingUserId != null && bulkUsernameConflictModal.existingUserId !== '') ||
                            (bulkUsernameConflictModal.existingCompanyId != null && bulkUsernameConflictModal.existingCompanyId !== '') ? (
                                <>
                                    {' '}(user id <strong>{bulkUsernameConflictModal.existingUserId ?? '—'}</strong>, company{' '}
                                    <strong>{bulkUsernameConflictModal.existingCompanyId ?? '—'}</strong>)
                                </>
                            ) : bulkUsernameConflictModal.orgId != null && bulkUsernameConflictModal.orgId !== '' ? (
                                <> in organization <strong>{bulkUsernameConflictModal.orgId}</strong></>
                            ) : (
                                <> in company <strong>{bulkUsernameConflictModal.companyId}</strong></>
                            )}
                            .
                        </p>
                        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">New username</label>
                        <input
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={bulkConflictReplacementUsername}
                            onChange={(e) => setBulkConflictReplacementUsername(e.target.value)}
                            placeholder="Unique username for this row"
                            autoFocus
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => { setBulkUsernameConflictModal(null); setBulkConflictReplacementUsername(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                onClick={handleBulkUsernameConflictResume}
                            >
                                Resume with this username
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className="fixed top-4 right-4 z-70 max-w-md rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-lg">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}

export default App;
