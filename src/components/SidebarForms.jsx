import React, { useRef } from "react";
import { motion } from "framer-motion";
import { SCRIPT_FIELDS } from "./ScriptRunnerForm.jsx";
import { Select } from "./ui/Select.jsx";
import { sideInput, sideLabel, fadeIn } from "../constants.js";

export function OrgForm({
  orgs,
  companies,
  selectedOrg,
  setSelectedOrg,
  selectedCompany,
  setSelectedCompany,
  orgDetails,
  companyDetails,
  newOrgName,
  setNewOrgName,
  newDomainUrl,
  setNewDomainUrl,
  newCompanyName,
  setNewCompanyName,
  disabled,
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex-1 min-w-0">
          <label className={sideLabel}>Organization</label>
          <Select
            value={selectedOrg || ""}
            onChange={(e) => setSelectedOrg(e.target.value || null)}
            className="w-full"
            searchable
            searchPlaceholder="Search orgs..."
            disabled={disabled}
          >
            <option value="">Select org...</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} (#{o.id})
              </option>
            ))}
          </Select>
        </div>
        {selectedOrg && (
          <div className="flex-1 min-w-0">
            <label className={sideLabel}>
              Company <span className="text-slate-400 normal-case">(opt)</span>
            </label>
            <Select
              value={selectedCompany || ""}
              onChange={(e) => setSelectedCompany(e.target.value || null)}
              className="w-full"
              disabled={disabled}
            >
              <option value="">None</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} #{c.id}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      {orgDetails && (
        <motion.div {...fadeIn} className="space-y-2 pt-1">
          <div className="h-px bg-slate-100" />
          <div>
            <label className={sideLabel}>New Org Name</label>
            <input
              className={sideInput}
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              onBlur={(e) => setNewOrgName(e.target.value.trim())}
              placeholder="New org name..."
              disabled={disabled}
            />
          </div>
          <div>
            <label className={sideLabel}>Domain URL</label>
            <input
              className={sideInput}
              value={newDomainUrl}
              onChange={(e) => setNewDomainUrl(e.target.value)}
              onBlur={(e) => setNewDomainUrl(e.target.value.trim())}
              placeholder="Domain..."
              disabled={disabled}
            />
          </div>
          {companyDetails && (
            <div>
              <label className={sideLabel}>New Company Name</label>
              <input
                className={sideInput}
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onBlur={(e) => setNewCompanyName(e.target.value.trim())}
                placeholder="Company name..."
                disabled={disabled}
              />
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}

export function CompanyForm({
  orgs,
  ccSourceOrg,
  setCcSourceOrg,
  ccCompanies,
  ccSelectedCompany,
  setCcSelectedCompany,
  ccDestOrg,
  setCcDestOrg,
  ccNewName,
  setCcNewName,
  disabled,
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex-1 min-w-0">
          <label className={sideLabel}>Source Org</label>
          <Select
            value={ccSourceOrg}
            onChange={(e) => setCcSourceOrg(e.target.value)}
            className="w-full"
            searchable
            searchPlaceholder="Search..."
            disabled={disabled}
          >
            <option value="">Select...</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} (#{o.id})
              </option>
            ))}
          </Select>
        </div>
        {ccSourceOrg && (
          <div className="flex-1 min-w-0">
            <label className={sideLabel}>Source Company</label>
            <Select
              value={ccSelectedCompany}
              onChange={(e) => setCcSelectedCompany(e.target.value)}
              className="w-full"
              disabled={disabled}
            >
              <option value="">Select...</option>
              {ccCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} #{c.id}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      {ccSelectedCompany && (
        <motion.div {...fadeIn} className="space-y-2">
          <div>
            <label className={sideLabel}>Destination Org</label>
            <Select
              value={ccDestOrg}
              onChange={(e) => setCcDestOrg(e.target.value)}
              className="w-full"
              searchable
              searchPlaceholder="Search..."
              disabled={disabled}
            >
              <option value="">Select dest org...</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (#{o.id})
                </option>
              ))}
            </Select>
          </div>
          {ccDestOrg && (
            <div>
              <label className={sideLabel}>New Company Name</label>
              <input
                className={sideInput}
                value={ccNewName}
                onChange={(e) => setCcNewName(e.target.value)}
                onBlur={(e) => setCcNewName(e.target.value.trim())}
                placeholder="Company name..."
                disabled={disabled}
              />
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}

export function BulkUsersSheetForm({
  bulkUserFile,
  setBulkUserFile,
  bulkUserSheetName,
  setBulkUserSheetName,
  disabled,
  onValidateOnly,
  validating,
  hasValidatedPayload,
  validationUsernames,
  verifyEmailAfterCreate,
  setVerifyEmailAfterCreate,
  lastCreatedUsersCsv,
  onDownloadCsv,
}) {
  const fileInputRef = useRef(null);
  return (
    <>
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
        <p className="text-[11px] text-emerald-800 leading-relaxed">
          Upload a sheet with columns:{" "}
          <strong>
            org, company, name, lastname, username, password, country, city,
            visibility,email
          </strong>
        </p>
      </div>
      <div>
        <label className={sideLabel}>Spreadsheet (.xlsx / .xls / .csv)</label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setBulkUserFile(f);
            }}
          />
          <button
            type="button"
            className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-left text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-50 truncate"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {bulkUserFile ? bulkUserFile.name : "Choose file…"}
          </button>
          {bulkUserFile && (
            <button
              type="button"
              className="h-8 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              disabled={disabled}
              onClick={() => {
                setBulkUserFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <label className={sideLabel}>
            Sheet name{" "}
            <span className="text-slate-400 normal-case">(optional)</span>
          </label>
          <a
            href="https://docs.google.com/spreadsheets/d/1P-WoGLs6bKYcqKS4JGtm5NCt-7bm05aEYh6cpTHvjtQ/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold text-blue-400 hover:text-blue-600"
          >
            Sample sheet
          </a>
        </div>
        <input
          className={sideInput}
          value={bulkUserSheetName}
          onChange={(e) => setBulkUserSheetName(e.target.value)}
          onBlur={(e) => setBulkUserSheetName(e.target.value.trim())}
          placeholder="First sheet if empty"
          disabled={disabled}
        />
      </div>
      {hasValidatedPayload && (
        <p className="text-[10px] font-semibold text-emerald-700">
          Validated — Start will POST JSON (faster) using parsed rows.
        </p>
      )}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="mt-0.5 size-3.5 text-emerald-600 focus:ring-emerald-500"
          checked={verifyEmailAfterCreate}
          onChange={(e) => setVerifyEmailAfterCreate(e.target.checked)}
          disabled={disabled}
        />
        <span className="text-[10px] leading-snug text-slate-700">
          <span className="font-semibold text-slate-900">Verify email after create</span>
         
        </span>
      </label>
      <button
        type="button"
        className="w-full h-8 rounded-lg border border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
        disabled={disabled || validating || !bulkUserFile}
        onClick={onValidateOnly}
      >
        {validating ? "Validating…" : "Validate sheet (parse + DB checks)"}
      </button>
      {validationUsernames &&
        (validationUsernames.dbUsernameConflicts?.length > 0 ||
          validationUsernames.internalDuplicates?.length > 0) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-2.5 py-2">
            <p className="text-[10px] font-bold text-amber-900">
              Username checks
            </p>
            <ul className="mt-1.5 space-y-1 text-[10px] leading-snug text-amber-950">
              {(validationUsernames.dbUsernameConflicts || []).map((c, i) => (
                <li key={`db-${i}`}>
                  Row{" "}
                  <span className="font-semibold tabular-nums">
                    {c.sheetRow}
                  </span>
                  :{" "}
                  <code className="rounded bg-amber-100/90 px-0.5 text-[9px]">
                    {c.username}
                  </code>{" "}
                  already exists
                  <span className="text-amber-800/90">
                    {" "}
                    (user id{" "}
                    <span className="font-semibold tabular-nums">
                      {c.existingUserId ?? "—"}
                    </span>
                    , company{" "}
                    <span className="font-semibold tabular-nums">
                      {c.existingCompanyId ?? "—"}
                    </span>
                    )
                  </span>
                </li>
              ))}
              {(validationUsernames.internalDuplicates || []).map((d, i) => (
                <li key={`dup-${i}`}>
                  Row{" "}
                  <span className="font-semibold tabular-nums">
                    {d.sheetRow}
                  </span>
                  :{" "}
                  <code className="rounded bg-amber-100/90 px-0.5 text-[9px]">
                    {d.username}
                  </code>{" "}
                  duplicate in sheet
                  {d.duplicateOfSheetRow != null && (
                    <span className="text-amber-800/90">
                      {" "}
                      (same as row {d.duplicateOfSheetRow})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      {lastCreatedUsersCsv && (
        <button
          type="button"
          className="w-full h-8 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          disabled={disabled}
          onClick={onDownloadCsv}
        >
          Download created users (CSV)
        </button>
      )}
      <p className="text-[10px] text-slate-400">
        <code className="text-slate-500">/api/bulk-users/parse</code> →{" "}
        <code className="text-slate-500">/api/bulk-users/run</code> (multipart
        or JSON + resume after username conflict).
      </p>
    </>
  );
}

export function UserForm({
  cuBaseUrl,
  setCuBaseUrl,
  cuEmail,
  setCuEmail,
  cuPassword,
  setCuPassword,
  cuCompanyId,
  setCuCompanyId,
  cuName,
  setCuName,
  cuCount,
  setCuCount,
  disabled,
}) {
  return (
    <>
      <div>
        <label className={sideLabel}>Base URL</label>
        <input
          className={sideInput}
          value={cuBaseUrl}
          onChange={(e) => setCuBaseUrl(e.target.value)}
          onBlur={(e) => setCuBaseUrl(e.target.value.trim())}
          placeholder="https://example.customvirtual.app"
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex-1">
          <label className={sideLabel}>Email</label>
          <input
            className={sideInput}
            type="email"
            value={cuEmail}
            onChange={(e) => setCuEmail(e.target.value)}
            onBlur={(e) => setCuEmail(e.target.value.trim())}
            placeholder="admin@example.com"
            disabled={disabled}
          />
        </div>
        <div className="flex-1">
          <label className={sideLabel}>Password</label>
          <input
            className={sideInput}
            type="password"
            value={cuPassword}
            onChange={(e) => setCuPassword(e.target.value)}
            onBlur={(e) => setCuPassword(e.target.value.trim())}
            placeholder="********"
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex-1">
          <label className={sideLabel}>Company ID</label>
          <input
            className={sideInput}
            value={cuCompanyId}
            onChange={(e) => setCuCompanyId(e.target.value)}
            onBlur={(e) => setCuCompanyId(e.target.value.trim())}
            placeholder="e.g. 204542"
            disabled={disabled}
          />
        </div>
        <div className="flex-1">
          <label className={sideLabel}>Name Prefix</label>
          <input
            className={sideInput}
            value={cuName}
            onChange={(e) => setCuName(e.target.value)}
            onBlur={(e) => setCuName(e.target.value.trim())}
            placeholder="e.g. Automation"
            disabled={disabled}
          />
        </div>
      </div>
      <div className="w-1/2">
        <label className={sideLabel}>Users Count</label>
        <input
          className={sideInput}
          type="number"
          min={1}
          max={50}
          value={cuCount}
          onChange={(e) => setCuCount(e.target.value)}
          disabled={disabled}
        />
      </div>
    </>
  );
}

export function InventoryPermissionForm({
  ipClientCompanyId,
  setIpClientCompanyId,
  ipVendorCompanyIds,
  setIpVendorCompanyIds,
  ipCreateApiClient,
  setIpCreateApiClient,
  ipProducts,
  setIpProducts,
  disabled,
}) {
  const productDefs = [
    { key: "diamond", label: "Diamond" },
    { key: "gemstone", label: "Gemstone" },
    { key: "jewelry", label: "Jewelry" },
    { key: "labgrown_diamond", label: "Labgrown Diamond" },
  ];

  const toggleProduct = (key) => {
    setIpProducts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
        <label className="text-[12px] font-semibold text-slate-700">
          Create API Client
        </label>
        <input
          type="checkbox"
          checked={ipCreateApiClient}
          onChange={(e) => setIpCreateApiClient(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className={sideLabel}>Client ID</label>
        <input
          className={sideInput}
          value={ipClientCompanyId}
          onChange={(e) => setIpClientCompanyId(e.target.value)}
          onBlur={(e) => setIpClientCompanyId(e.target.value.trim())}
          placeholder="e.g. 204542"
          disabled={disabled}
        />
      </div>

      <div>
        <label className={sideLabel}>Vendor ID(s)</label>
        <input
          className={sideInput}
          value={ipVendorCompanyIds}
          onChange={(e) => setIpVendorCompanyIds(e.target.value)}
          onBlur={(e) => setIpVendorCompanyIds(e.target.value.trim())}
          placeholder="e.g. 39416, 91268"
          disabled={disabled}
        />
        <p className="mt-1 text-[10px] text-slate-400">
          Use comma-separated vendor company IDs for multi-vendor inventory.
        </p>
      </div>

      <div>
        <label className={sideLabel}>Product Permissions</label>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2">
          {productDefs.map((product) => (
            <label
              key={product.key}
              className="flex items-center gap-2 text-[12px] text-slate-700"
            >
              <input
                type="checkbox"
                checked={!!ipProducts[product.key]}
                onChange={() => toggleProduct(product.key)}
                disabled={disabled}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              {product.label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

export function ScriptForm({ mode, scriptValues, setScriptValues, disabled }) {
  const sheetFileInputRef = useRef(null);
  const sampleSheetUrl =
    "https://docs.google.com/spreadsheets/d/1cFRVoDdhwU9zlCH_q3e-TR5KkRvHuxiy9KmTU4SsaKo/edit?usp=sharing";
  const nav_id = mode;
  const scriptKey = nav_id
    .replace("script-copy-search-menus", "copyCustomSearchMenus")
    .replace("script-copy-white-label", "copyOrgWhiteLabel")
    .replace("script-copy-customizations", "copyCustomizations")
    .replace("script-copy-custom-data", "copyCustomDataAndValues")
    .replace("script-test-features", "testFeatureActivation")
    .replace("script-test-customizations", "testCustomizations")
    .replace(
      "script-import-search-menus-sheet",
      "importCustomSearchMenusFromSheet",
    );

  const cfg = SCRIPT_FIELDS[scriptKey];
  if (!cfg) return null;

  const currentScope = scriptValues._scope || "org";
  const sourceScope = scriptValues._sourceScope || "org";
  const targetScope = scriptValues._targetScope || "org";
  const activeFields = cfg.dualScopeSelector
    ? [
        {
          key: "sourceId",
          label:
            sourceScope === "company" ? "Source Company ID" : "Source Org ID",
          placeholder: sourceScope === "company" ? "e.g. 39416" : "e.g. 500",
        },
        {
          key: "targetId",
          label:
            targetScope === "company" ? "Target Company ID" : "Target Org ID",
          placeholder: targetScope === "company" ? "e.g. 91549" : "e.g. 945",
        },
      ]
    : cfg.scopeSelector
      ? cfg.fieldsByScope?.[currentScope] || cfg.fields
      : cfg.fields;
  const customizationTypeOptions = [
    { value: "global", label: "Global", defaultSelected: true },
    { value: "custom_texts", label: "Custom Texts", defaultSelected: true },
    {
      value: "json_navigation_menu",
      label: "JsonNavigationMenu",
      defaultSelected: true,
    },
    { value: "pdp", label: "PDP", defaultSelected: false },
    { value: "search_form", label: "Search form", defaultSelected: false },
    { value: "search_result", label: "Search result", defaultSelected: false },
    {
      value: "product_unified_page",
      label: "Product unified page",
      defaultSelected: false,
    },
  ];
  const defaultCustomizationTypeValues = customizationTypeOptions
    .filter((opt) => opt.defaultSelected)
    .map((opt) => opt.value);
  const selectedCustomizationTypes = Array.isArray(
    scriptValues._customizationTypes,
  )
    ? scriptValues._customizationTypes
    : defaultCustomizationTypeValues;
  const toggleCustomizationType = (typeValue) => {
    setScriptValues((prev) => {
      const current = Array.isArray(prev._customizationTypes)
        ? prev._customizationTypes
        : defaultCustomizationTypeValues;
      const exists = current.includes(typeValue);
      return {
        ...prev,
        _customizationTypes: exists
          ? current.filter((item) => item !== typeValue)
          : [...current, typeValue],
      };
    });
  };
  const customDataSectionOptions = [
    { value: "headers", label: "Custom Data Headers" },
    { value: "values", label: "Custom Data Values" },
  ];
  const selectedCustomDataSections = Array.isArray(
    scriptValues._customDataSections,
  )
    ? scriptValues._customDataSections
    : customDataSectionOptions.map((opt) => opt.value);
  const toggleCustomDataSection = (sectionValue) => {
    setScriptValues((prev) => {
      const current = Array.isArray(prev._customDataSections)
        ? prev._customDataSections
        : customDataSectionOptions.map((opt) => opt.value);
      const exists = current.includes(sectionValue);
      return {
        ...prev,
        _customDataSections: exists
          ? current.filter((item) => item !== sectionValue)
          : [...current, sectionValue],
      };
    });
  };

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () =>
        reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  return (
    <>
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
        <p className="text-[11px] text-amber-700 leading-relaxed">
          {cfg.description}
        </p>
        {scriptKey === "importCustomSearchMenusFromSheet" && (
          <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
            <span className="block">
              SVG icon / PNG icon columns accept plain URLs (https://…) or Excel hyperlinks to
              public files—useful for CDN links.
            </span>
            <span className="mt-0.5 block">
              Sample sheet:{" "}
              <a
                href={sampleSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-2 hover:text-amber-900"
              >
                Open Google Sheet
              </a>
            </span>
          </p>
        )}
      </div>
      {cfg.dualScopeSelector && (
        <>
          <div>
            <label className={sideLabel}>Source Scope</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  !disabled &&
                  setScriptValues((p) => ({ ...p, _sourceScope: "org" }))
                }
                disabled={disabled}
                className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  sourceScope === "org"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                } disabled:opacity-50`}
              >
                Organization
              </button>
              <button
                type="button"
                onClick={() =>
                  !disabled &&
                  setScriptValues((p) => ({ ...p, _sourceScope: "company" }))
                }
                disabled={disabled}
                className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  sourceScope === "company"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                } disabled:opacity-50`}
              >
                Company
              </button>
            </div>
          </div>
          <div>
            <label className={sideLabel}>Target Scope</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  !disabled &&
                  setScriptValues((p) => ({ ...p, _targetScope: "org" }))
                }
                disabled={disabled}
                className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  targetScope === "org"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                } disabled:opacity-50`}
              >
                Organization
              </button>
              <button
                type="button"
                onClick={() =>
                  !disabled &&
                  setScriptValues((p) => ({ ...p, _targetScope: "company" }))
                }
                disabled={disabled}
                className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  targetScope === "company"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                } disabled:opacity-50`}
              >
                Company
              </button>
            </div>
          </div>
        </>
      )}
      {cfg.scopeSelector && !cfg.dualScopeSelector && (
        <div>
          <label className={sideLabel}>Scope</label>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() =>
                !disabled && setScriptValues((p) => ({ ...p, _scope: "org" }))
              }
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                currentScope === "org"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              } disabled:opacity-50`}
            >
              Organization
            </button>
            <button
              type="button"
              onClick={() =>
                !disabled &&
                setScriptValues((p) => ({ ...p, _scope: "company" }))
              }
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                currentScope === "company"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              } disabled:opacity-50`}
            >
              Company
            </button>
          </div>
        </div>
      )}
      {scriptKey === "copyCustomizations" && (
        <div>
          <label className={sideLabel}>Customization Sections</label>
          <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-2">
            {customizationTypeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-[12px] text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedCustomizationTypes.includes(option.value)}
                  onChange={() => toggleCustomizationType(option.value)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Global, custom texts, and nav are on by default. Enable PDP, search form,
            search result, and/or product unified page only when you want those layout
            rows copied from the <code className="text-slate-600">customizations</code>{" "}
            table.
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Select at least one section to copy.
          </p>
        </div>
      )}
      {scriptKey === "copyCustomDataAndValues" && (
        <div>
          <label className={sideLabel}>Copy Sections</label>
          <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-2">
            {customDataSectionOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-[12px] text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedCustomDataSections.includes(option.value)}
                  onChange={() => toggleCustomDataSection(option.value)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Select at least one section to copy.
          </p>
        </div>
      )}
      <div
        className={
          activeFields.length === 2 ? "flex flex-col gap-2" : "space-y-2"
        }
      >
        {activeFields.map((f) => (
          <div
            key={f.key}
            className={activeFields.length === 2 ? "flex-1 min-w-0" : ""}
          >
            <label className={sideLabel}>{f.label}</label>
            {scriptKey === "importCustomSearchMenusFromSheet" &&
            f.key === "xlsxPath" ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    className={sideInput}
                    value={scriptValues[f.key] || ""}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setScriptValues((p) => {
                        const uploadedName = p.xlsxFileUpload?.filename || "";
                        const keepUpload =
                          !!uploadedName && nextValue.trim() === uploadedName;
                        return {
                          ...p,
                          [f.key]: nextValue,
                          xlsxFileUpload: keepUpload ? p.xlsxFileUpload : null,
                        };
                      });
                    }}
                    onBlur={(e) => {
                      const trimmed = e.target.value.trim();
                      setScriptValues((p) => {
                        const uploadedName = p.xlsxFileUpload?.filename || "";
                        const keepUpload =
                          !!uploadedName && trimmed === uploadedName;
                        return {
                          ...p,
                          [f.key]: trimmed,
                          xlsxFileUpload: keepUpload ? p.xlsxFileUpload : null,
                        };
                      });
                    }}
                    placeholder={f.placeholder}
                    disabled={disabled}
                  />
                  <input
                    ref={sheetFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await readFileAsBase64(file);
                        const base64 = dataUrl.split(",")[1] || "";
                        setScriptValues((p) => ({
                          ...p,
                          xlsxPath: file.name,
                          xlsxFileUpload: {
                            filename: file.name,
                            contentBase64: base64,
                          },
                        }));
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => sheetFileInputRef.current?.click()}
                  >
                    Browse
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Tip: You can paste a path or pick the file directly.
                </p>
              </div>
            ) : (
              <input
                className={sideInput}
                value={scriptValues[f.key] || ""}
                onChange={(e) =>
                  setScriptValues((p) => ({ ...p, [f.key]: e.target.value }))
                }
                onBlur={(e) =>
                  setScriptValues((p) => ({
                    ...p,
                    [f.key]: e.target.value.trim(),
                  }))
                }
                placeholder={f.placeholder}
                disabled={disabled}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
