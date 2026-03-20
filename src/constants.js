import {
    Building, Building2, FileCode, Copy, Palette, Zap, FlaskConical, KeyRound, FileSpreadsheet,
} from 'lucide-react';

export const NAV_ITEMS = [
    { id: 'org', label: 'Copy Organization', icon: Building2, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { id: 'company', label: 'Copy Company', icon: Building, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'bulk-users-sheet', label: 'Bulk users (Excel/CSV)', icon: FileSpreadsheet, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
    { id: 'script-copy-search-menus', label: 'Copy custom search menus', icon: Copy, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', scriptKey: 'copyCustomSearchMenus' },
    { id: 'script-copy-white-label', label: 'Copy white label', icon: Palette, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', scriptKey: 'copyOrgWhiteLabel' },
    { id: 'script-copy-customizations', label: 'Copy customizations (org/company)', icon: FileCode, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', scriptKey: 'copyCustomizations' },
    { id: 'script-copy-custom-data', label: 'Copy custom data & values', icon: FileCode, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', scriptKey: 'copyCustomDataAndValues' },
    { id: 'script-test-features', label: 'Copy company feature switches', icon: Zap, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', scriptKey: 'testFeatureActivation' },
    { id: 'script-test-customizations', label: 'Test PDP / search customizations', icon: FlaskConical, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', scriptKey: 'testCustomizations' },
    { id: 'script-import-search-menus-sheet', label: 'Import search menus from sheet', icon: FileCode, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', scriptKey: 'importCustomSearchMenusFromSheet' },
    { id: 'inventory-permissions', label: 'Inventory API Permissions', icon: KeyRound, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-700' },
];

export const STEP_DEFS = {
    org: [
        { id: 'fetch-data', label: 'Fetch Production Data' },
        { id: 'validate-names', label: 'Validate Names' },
        { id: 'create-org', label: 'Create Organization' },
        { id: 'apply-settings', label: 'Apply Org Settings' },
        { id: 'create-company', label: 'Create Company + Features' },
        { id: 'copy-customizations-api', label: 'Copy Customizations (API)' },
        { id: 'copy-white-label', label: 'Copy White Label' },
        { id: 'copy-search-menus', label: 'Copy Search Menus' },
        { id: 'validate-finalize', label: 'Validate & Finalize' },
    ],
    company: [
        { id: 'verify-org', label: 'Verify Target Organization' },
        { id: 'validate-name', label: 'Validate Company Name' },
        { id: 'fetch-source', label: 'Fetch Source Company Data' },
        { id: 'run-spec', label: 'Run Company Replication (Playwright)' },
        { id: 'lookup-id', label: 'Lookup New Company ID' },
    ],
    inventoryPermissions: [
        { id: 'validate-fields', label: 'Validate Input Fields' },
        { id: 'run-spec', label: 'Create API Client / Inventory Permissions' },
    ],
    copyCustomSearchMenus: [
        { id: 'init', label: 'Initialize' },
        { id: 'run', label: 'Copy Search Menu Types & Menus' },
    ],
    copyOrgWhiteLabel: [
        { id: 'init', label: 'Initialize' },
        { id: 'run', label: 'Copy White Label Configs' },
    ],
    copyCustomizations: [
        { id: 'init', label: 'Initialize' },
        { id: 'run', label: 'Copy selected sections' },
    ],
    copyCustomDataAndValues: [
        { id: 'init', label: 'Initialize' },
        { id: 'run', label: 'Copy Custom Data Headers & Values' },
    ],
    testFeatureActivation: [
        { id: 'init', label: 'Initialize' },
        { id: 'run', label: 'Activate Features on Target' },
    ],
    testCustomizations: [
        { id: 'init', label: 'Initialize' },
        { id: 'run', label: 'Run Customizations Spec' },
    ],
    importCustomSearchMenusFromSheet: [
        { id: 'init', label: 'Initialize' },
        { id: 'run', label: 'Import from Sheet' },
    ],
    bulkUsersSheet: [
        { id: 'upload-run', label: 'POST create users + DB lookup + email verified' },
    ],
};

export const sideInput = 'w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400';
export const sideLabel = 'text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block';

export const fadeIn = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};
