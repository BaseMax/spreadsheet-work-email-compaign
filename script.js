const STORAGE_KEY = "outreach_crm_lite_v1";
const APP_VERSION = 1;

const STATUS_TIMESTAMP_KEY = {
    1: "sent_at_initial",
    2: "sent_at_followup1",
    3: "sent_at_followup2",
    4: "sent_at_followup3"
};

const STATUS_SEND_LABEL = {
    1: "Date/time initial email was sent",
    2: "Date/time first follow-up was sent",
    3: "Date/time second follow-up was sent",
    4: "Date/time final follow-up was sent"
};

const SEQUENCE_STATUSES = [1, 2, 3, 4];

const REMINDER_SETTING_KEY = {
    1: "days_after_initial",
    2: "days_after_followup1",
    3: "days_after_followup2",
    4: "days_after_followup3"
};

let activeFilter = "all"; // "all" | "needs_action" | "overdue"

const STATUS_OPTIONS = [
    { value: 0, label: "Waiting for initial email" },
    { value: 1, label: "Initial email sent" },
    { value: 2, label: "No reply — first follow-up" },
    { value: 3, label: "No reply — second follow-up" },
    { value: 4, label: "No reply — final follow-up" },
    { value: 5, label: "Replied / in progress" },
    { value: 6, label: "Closed / do not contact" }
];

const DEFAULT_STATE = {
    version: APP_VERSION,
    settings: {
    your_name: "Max Base",
    company_name: "BSafe Group",
    default_contact_label: "there",
    enable_xlsx: true,
    days_after_initial: 5,
    days_after_followup1: 7,
    days_after_followup2: 7,
    days_after_followup3: 10,
    },
    lookupLists: {
    industry: ["Software", "Manufacturing", "Healthcare", "Education", "Finance"],
    category: ["B2B", "B2C", "Enterprise", "Startup"],
    company_size: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
    status: STATUS_OPTIONS.map(s => `${s.value} — ${s.label}`),
    },
    templates: {
    initial: {
        subject: "Potential collaboration with {{company_name}}",
        body: `Hello {{contact_name | default: "there"}},

I hope you are doing well.

I’m reaching out regarding a potential collaboration between {{your_company_name}} and {{company_name}}.

Based on your role as {{position}}, we believe we can support your team with:
{{proposed_idea}}

We typically work with organizations in the {{industry}} sector, helping improve {{category}} outcomes, particularly for {{company_size}} companies.

Would you be open to a short introductory call to explore this further?

Best regards,
{{your_name}}`
    },
    followup1: {
        subject: "Follow-up on {{your_company_name}} × {{company_name}}",
        body: `Hello {{contact_name | default: "there"}},

I wanted to follow up on my previous message regarding {{your_company_name}}’s potential support for {{company_name}}.

We can tailor a practical solution around your current priorities, whether in operations, technology, compliance, or marketing.

Would a short introductory discussion be possible this week or next?

Best regards,
{{your_name}}`
    },
    followup2: {
        subject: "Second follow-up – {{company_name}}",
        body: `Hello {{contact_name | default: "there"}},

I’m reaching out again to briefly follow up.

We believe {{your_company_name}} can support {{company_name}} in improving efficiency, strengthening digital visibility, and reducing operational risks.

I’d be happy to share a concise proposal focused on one key priority area.

Would you be available for a quick call?

Best regards,
{{your_name}}`
    },
    followup3: {
        subject: "Final follow-up – {{company_name}}",
        body: `Hello {{contact_name | default: "there"}},

This is my final follow-up regarding {{your_company_name}}’s potential collaboration with {{company_name}}.

If this is not currently relevant, I would appreciate it if you could direct me to the appropriate contact, or keep us in mind for future initiatives.

Thank you for your time.

Best regards,
{{your_name}}`
    }
    },
    rows: [
    {
        company_name: "Acme Studio",
        email: "hello@acme.example",
        contact_name: "Sara",
        position: "Marketing Manager",
        industry: "Software",
        category: "B2B",
        company_size: "11-50",
        proposed_idea: "Website optimization, lead generation, and email automation",
        status: 0,
        comments: "Warm lead from conference"
    }
    ]
};

let state = loadState();
let activeTemplateKey = "initial";
let activeListKey = "industry";

const el = (id) => document.getElementById(id);
const grid = el("dataGrid");
const modalBackdrop = el("modalBackdrop");
const modalBody = el("modalBody");
const toast = el("toast");

function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

function loadState() {
    try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
    } catch (e) {
    console.warn(e);
    return deepClone(DEFAULT_STATE);
    }
}

function normalizeState(parsed) {
    const base = deepClone(DEFAULT_STATE);
    if (!parsed || typeof parsed !== "object") return base;
    base.version = APP_VERSION;
    base.settings = { ...base.settings, ...(parsed.settings || {}) };
    base.lookupLists = { ...base.lookupLists, ...(parsed.lookupLists || {}) };
    base.templates = { ...base.templates, ...(parsed.templates || {}) };
    base.rows = Array.isArray(parsed.rows) ? parsed.rows.map(normalizeRow) : base.rows;
    if (!base.rows.length) base.rows = deepClone(DEFAULT_STATE.rows);
    return base;
}

function normalizeRow(row) {
    return {
    company_name: row.company_name ?? "",
    email: row.email ?? "",
    contact_name: row.contact_name ?? "",
    position: row.position ?? "",
    industry: row.industry ?? "",
    category: row.category ?? "",
    company_size: row.company_size ?? "",
    proposed_idea: row.proposed_idea ?? "",
    status: Number.isFinite(Number(row.status)) ? Number(row.status) : 0,
    comments: row.comments ?? "",
    sent_at_initial: row.sent_at_initial ?? null,
    sent_at_followup1: row.sent_at_followup1 ?? null,
    sent_at_followup2: row.sent_at_followup2 ?? null,
    sent_at_followup3: row.sent_at_followup3 ?? null,
    };
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    el("syncStatus").textContent = `Local cache updated · ${new Date().toLocaleString()}`;
}

function toastMsg(message) {
    toast.textContent = message;
    toast.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.style.display = "none", 2400);
}

function openModal(html) {
    modalBody.innerHTML = html;
    modalBackdrop.style.display = "flex";
    modalBackdrop.scrollTop = 0;
}
function closeModal() {
    modalBackdrop.style.display = "none";
    modalBody.innerHTML = "";
}
modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
});

function escapeHtml(str) {
    return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getVariables() {
    return [
    ["company_name", state.settings.company_name],
    ["your_name", state.settings.your_name],
    ["your_company_name", state.settings.company_name],
    ["contact_name", state.settings.default_contact_label || "there"],
    ["position", ""],
    ["industry", ""],
    ["category", ""],
    ["company_size", ""],
    ["proposed_idea", ""],
    ["email", ""],
    ["status", ""],
    ["comments", ""]
    ];
}

function renderVariableHints() {
    const container = el("variableHints");
    container.innerHTML = getVariables().map(([key, val]) => `<span class="chip" data-copy="{{${key}}}"><span class="badge">${key}</span></span>`).join("");
    container.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", async () => {
        const txt = chip.getAttribute("data-copy");
        try {
        await navigator.clipboard.writeText(txt);
        toastMsg(`Copied ${txt}`);
        } catch {
        toastMsg(`Variable: ${txt}`);
        }
    });
    });
    el("templateHelp").innerHTML = `Supported syntax: <code>{{field_name}}</code> and <code>{{field_name | default: "fallback"}}</code>. Example: <code>Hello {{contact_name | default: "there"}}</code>.`;
}

function renderLookupOverview() {
    const keys = ["industry", "category", "company_size", "status"];
    el("lookupOverview").innerHTML = keys.map(key => {
    const count = state.lookupLists[key]?.length || 0;
    return `
        <div class="kv">
        <div><strong>${key.replaceAll("_", " ")}</strong><div class="tiny muted">${count} values</div></div>
        <button class="small" data-edit-list="${key}">Edit</button>
        <button class="small danger" data-reset-list="${key}">Reset</button>
        </div>`;
    }).join("");

    el("lookupOverview").querySelectorAll("[data-edit-list]").forEach(btn => {
    btn.addEventListener("click", () => editLookupList(btn.dataset.editList));
    });
    el("lookupOverview").querySelectorAll("[data-reset-list]").forEach(btn => {
    btn.addEventListener("click", () => {
        const key = btn.dataset.resetList;
        const defaults = deepClone(DEFAULT_STATE.lookupLists[key]);
        state.lookupLists[key] = defaults;
        saveState();
        renderAll();
        toastMsg(`${key} reset to defaults`);
    });
    });
}

function renderTemplateOverview() {
    const items = Object.entries(state.templates).map(([key, t]) => `
    <div class="template-card">
        <h3>${key}</h3>
        <div class="tiny muted">Subject: ${escapeHtml(t.subject)}</div>
        <pre>${escapeHtml(t.body)}</pre>
        <div class="toolbar" style="margin-top:10px;">
        <button class="small" data-edit-template="${key}">Edit</button>
        <button class="small" data-preview-template="${key}">Preview</button>
        </div>
    </div>
    `).join("");
    el("templateOverview").innerHTML = items;
    el("templateOverview").querySelectorAll("[data-edit-template]").forEach(btn => btn.addEventListener("click", () => editTemplate(btn.dataset.editTemplate)));
    el("templateOverview").querySelectorAll("[data-preview-template]").forEach(btn => btn.addEventListener("click", () => previewTemplate(btn.dataset.previewTemplate)));
}

function daysSince(isoString) {
    if (!isoString) return null;
    const ms = Date.now() - new Date(isoString).getTime();
    return Math.floor(ms / 86400000);
}

/**
 * For a row, determine its reminder urgency:
 * "overdue"  — more days have passed than the configured threshold
 * "due_soon" — within 1 day of the threshold
 * "ok"       — sent but not yet due
 * "none"     — no timestamp relevant (status 0, 5, 6)
 */
function rowUrgency(row) {
    const s = Number(row.status);
    if (!SEQUENCE_STATUSES.includes(s)) return "none";
    const tsKey = STATUS_TIMESTAMP_KEY[s];
    const days = daysSince(row[tsKey]);
    if (days === null) return "no_timestamp";
    const settingKey = REMINDER_SETTING_KEY[s];
    const threshold = Number(state.settings[settingKey] ?? 7);
    if (days > threshold) return "overdue";
    if (days >= threshold - 1) return "due_soon";
    return "ok";
}

function rowNeedsAction(row) {
    const u = rowUrgency(row);
    return u === "overdue" || u === "due_soon" || u === "no_timestamp";
}

function getLocalDatetimeString() {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function renderStats() {
    const rows = state.rows.length;
    const waiting = state.rows.filter(r => Number(r.status) === 0).length;
    const sent = state.rows.filter(r => SEQUENCE_STATUSES.includes(Number(r.status))).length;
    const replied = state.rows.filter(r => Number(r.status) === 5).length;
    const closed = state.rows.filter(r => Number(r.status) === 6).length;
    const overdue = state.rows.filter(r => rowUrgency(r) === "overdue").length;
    const dueSoon = state.rows.filter(r => rowUrgency(r) === "due_soon").length;
    el("statsBar").innerHTML = `
    <span class="pill">Rows <b class="badge">${rows}</b></span>
    <span class="pill">Waiting <b class="badge">${waiting}</b></span>
    <span class="pill">In sequence <b class="badge">${sent}</b></span>
    <span class="pill">Replied <b class="badge">${replied}</b></span>
    <span class="pill">Closed <b class="badge">${closed}</b></span>
    ${overdue ? `<span class="pill pill-overdue">Overdue <b class="badge">${overdue}</b></span>` : ""}
    ${dueSoon ? `<span class="pill pill-due-soon">Due soon <b class="badge">${dueSoon}</b></span>` : ""}
    `;
}

function renderFilterBar() {
    const bar = el("filterBar");
    if (!bar) return;
    const overdue = state.rows.filter(r => rowUrgency(r) === "overdue").length;
    const needs = state.rows.filter(rowNeedsAction).length;
    bar.innerHTML = `
    <button class="filter-btn ${activeFilter === "all" ? "active" : ""}" data-filter="all">All rows</button>
    <button class="filter-btn ${activeFilter === "needs_action" ? "active" : ""}" data-filter="needs_action">
        Needs action ${needs ? `<span class="badge">${needs}</span>` : ""}
    </button>
    <button class="filter-btn ${activeFilter === "overdue" ? "active" : ""}" data-filter="overdue">
        Overdue ${overdue ? `<span class="badge badge-red">${overdue}</span>` : ""}
    </button>
    `;
    bar.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderFilterBar();
        renderGrid();
    });
    });
}

function renderGrid() {
    const columns = [
    { key: "company_name", label: "Company Name", type: "text", hint: "Required." },
    { key: "email", label: "Email", type: "text", hint: "Primary email address." },
    { key: "contact_name", label: "Contact Name", type: "text", hint: "Optional." },
    { key: "position", label: "Position", type: "text", hint: "Optional." },
    { key: "industry", label: "Industry Type", type: "select", optionsKey: "industry", hint: "Managed lookup list." },
    { key: "category", label: "Company Category", type: "select", optionsKey: "category", hint: "Managed lookup list." },
    { key: "company_size", label: "Company Size", type: "select", optionsKey: "company_size", hint: "Managed lookup list." },
    { key: "proposed_idea", label: "Proposed Idea", type: "textarea", hint: "Short and structured." },
    { key: "status", label: "Status", type: "select", optionsKey: "status", hint: "Pipeline stage." },
    { key: "_timeline", label: "Timeline", type: "timeline", hint: "Send dates & days elapsed." },
    { key: "comments", label: "Comments", type: "textarea", hint: "Notes, objections, follow-ups." },
    { key: "actions", label: "Actions", type: "actions", hint: "Row operations." }
    ];

    const colgroup = columns.map((c, i) => {
    const widths = [160, 220, 150, 140, 150, 150, 140, 250, 190, 200, 240, 120];
    return `<col style="width:${widths[i]}px">`;
    }).join("");

    const thead = columns.map(c => `<th>${c.label}<span class="hint">${c.hint}</span></th>`).join("");

    let visibleRows = state.rows.map((row, idx) => ({ row, idx }));
    if (activeFilter === "needs_action") {
        visibleRows = visibleRows.filter(({ row }) => rowNeedsAction(row));
    } else if (activeFilter === "overdue") {
        visibleRows = visibleRows.filter(({ row }) => rowUrgency(row) === "overdue");
    }

    const tbody = visibleRows.map(({ row, idx: rowIndex }) => {
    const urgency = rowUrgency(row);
    const rowClass = urgency === "overdue" ? "row-overdue" : urgency === "due_soon" ? "row-due-soon" : urgency === "no_timestamp" ? "row-no-timestamp" : "";
    const cells = columns.map(c => {
        if (c.key === "actions") {
        return `<td><div class="actions"><button class="small" data-fill-template="${rowIndex}">Templates</button><button class="small danger" data-del-row="${rowIndex}">Delete</button></div></td>`;
        }
        if (c.key === "_timeline") {
        return `<td>${buildTimelineCell(row, rowIndex)}</td>`;
        }
        if (c.type === "text") {
        return `<td><input value="${escapeHtml(row[c.key] ?? "")}" data-row="${rowIndex}" data-key="${c.key}" /></td>`;
        }
        if (c.type === "textarea") {
        return `<td><textarea data-row="${rowIndex}" data-key="${c.key}">${escapeHtml(row[c.key] ?? "")}</textarea></td>`;
        }
        if (c.type === "select") {
        const options = buildOptions(c.optionsKey, row[c.key]);
        return `<td><select data-row="${rowIndex}" data-key="${c.key}">${options}</select></td>`;
        }
        return `<td></td>`;
    }).join("");
    return `<tr class="${rowClass}" data-rowindex="${rowIndex}">${cells}</tr>`;
    }).join("");

    grid.innerHTML = `<colgroup>${colgroup}</colgroup><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody>`;

    grid.querySelectorAll("[data-row]").forEach(node => {
    const rowIndex = Number(node.dataset.row);
    const key = node.dataset.key;
    if (key === "status") {
        node.addEventListener("change", () => handleStatusChange(rowIndex, Number(node.value), node));
    } else {
        const handler = () => {
        state.rows[rowIndex][key] = node.value;
        saveState();
        renderStats();
        renderFilterBar();
        renderTemplateOverview();
        };
        node.addEventListener("input", handler);
        node.addEventListener("change", handler);
    }
    });
    grid.querySelectorAll("[data-del-row]").forEach(btn => {
    btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.delRow);
        state.rows.splice(idx, 1);
        saveState();
        renderAll();
        toastMsg("Row deleted");
    });
    });
    grid.querySelectorAll("[data-fill-template]").forEach(btn => {
    btn.addEventListener("click", () => openTemplatePicker(Number(btn.dataset.fillTemplate)));
    });
    grid.querySelectorAll("[data-edit-timestamp]").forEach(btn => {
    btn.addEventListener("click", () => {
        const rowIndex = Number(btn.dataset.editTimestamp);
        const tsKey = btn.dataset.tsKey;
        openTimestampModal(rowIndex, tsKey);
    });
    });
}

function buildTimelineCell(row, rowIndex) {
    const s = Number(row.status);
    const entries = [
    { tsKey: "sent_at_initial", label: "Initial", statusValue: 1 },
    { tsKey: "sent_at_followup1", label: "FU #1", statusValue: 2 },
    { tsKey: "sent_at_followup2", label: "FU #2", statusValue: 3 },
    { tsKey: "sent_at_followup3", label: "FU #3", statusValue: 4 },
    ];
    const lines = entries.map(e => {
    const isCurrentStatus = s === e.statusValue;
    const isAccessible = s >= e.statusValue;
    const ts = row[e.tsKey];
    const days = daysSince(ts);
    if (ts) {
        const daysStr = days === 0 ? "today" : `${days}d ago`;
        const settingKey = REMINDER_SETTING_KEY[e.statusValue];
        const threshold = Number(state.settings[settingKey] ?? 7);
        const isOverdue = days > threshold;
        const isDueSoon = days >= threshold - 1 && !isOverdue;
        const cls = isCurrentStatus ? (isOverdue ? "ts-overdue" : isDueSoon ? "ts-due-soon" : "ts-ok") : "ts-past";
        const editBtn = `<button class="tiny-btn" data-edit-timestamp="${rowIndex}" data-ts-key="${e.tsKey}" title="Edit date">✎</button>`;
        return `<div class="ts-row ${cls}">${e.label}: <span>${formatDateShort(ts)}</span> <span class="ts-days">(${daysStr})</span>${editBtn}</div>`;
    } else if (isAccessible) {
        return `<div class="ts-row ts-missing"><button class="tiny-btn ts-set-btn" data-edit-timestamp="${rowIndex}" data-ts-key="${e.tsKey}" title="Set send date">Set ${e.label} date</button></div>`;
    }
    return "";
    }).filter(Boolean).join("");
    return `<div class="timeline-cell">${lines || '<span class="muted" style="font-size:11px;">—</span>'}</div>`;
}

function formatDateShort(iso) {
    if (!iso) return "—";
    try {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return iso; }
}

/**
 * Called when the user changes the status dropdown.
 * For statuses 1-4, we intercept and ask for the send date/time.
 * For other statuses, we validate prerequisites.
 */
function handleStatusChange(rowIndex, newStatus, selectNode) {
    const row = state.rows[rowIndex];
    const oldStatus = row.status;

    if (newStatus === 2 && !row.sent_at_initial) {
        toastMsg("⚠ Cannot set Follow-up #1: please set the Initial email date first.");
        selectNode.value = oldStatus;
        return;
    }
    if (newStatus === 3 && !row.sent_at_followup1) {
        toastMsg("⚠ Cannot set Follow-up #2: please set Follow-up #1 date first.");
        selectNode.value = oldStatus;
        return;
    }
    if (newStatus === 4 && !row.sent_at_followup2) {
        toastMsg("⚠ Cannot set Follow-up #3: please set Follow-up #2 date first.");
        selectNode.value = oldStatus;
        return;
    }

    if (SEQUENCE_STATUSES.includes(newStatus)) {
        const tsKey = STATUS_TIMESTAMP_KEY[newStatus];
        const label = STATUS_SEND_LABEL[newStatus];
        openStatusDateModal(rowIndex, newStatus, tsKey, label, selectNode, oldStatus);
    } else {
        row.status = newStatus;
        saveState();
        renderAll();
    }
}

function openStatusDateModal(rowIndex, newStatus, tsKey, label, selectNode, oldStatus) {
    const row = state.rows[rowIndex];
    const existingVal = row[tsKey] ? row[tsKey].slice(0, 16) : getLocalDatetimeString();
    openModal(`
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Set send date</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">${escapeHtml(label)} for <strong>${escapeHtml(row.company_name || "this row")}</strong></p>
        </div>
        </div>
    </header>
    <div class="modal-grid" style="margin-top:16px;">
        <div class="full template-editor">
        <label class="tiny muted">${escapeHtml(label)}</label>
        <input type="datetime-local" id="statusDateInput" value="${escapeHtml(existingVal)}" style="font-size:15px;padding:12px;" />
        </div>
        <div class="full footer-note">
        This timestamp is used to calculate how many days have passed and when the next action is due.
        </div>
    </div>
    <div class="modal-actions">
        <button id="cancelStatusDate">Cancel (keep old status)</button>
        <button class="primary" id="confirmStatusDate">Confirm</button>
    </div>`);
        document.getElementById("cancelStatusDate").onclick = () => {
        selectNode.value = oldStatus;
        closeModal();
    };
    document.getElementById("confirmStatusDate").onclick = () => {
    const val = document.getElementById("statusDateInput").value;
    if (!val) { toastMsg("Please select a date/time."); return; }
    row.status = newStatus;
    row[tsKey] = new Date(val).toISOString();
    saveState();
    renderAll();
    closeModal();
    toastMsg("Status updated with send date.");
    };
    window.__closeModal = () => {
    selectNode.value = oldStatus;
    closeModal();
    };
}

function openTimestampModal(rowIndex, tsKey) {
    const row = state.rows[rowIndex];
    const labelMap = {
    sent_at_initial: "Initial email sent date",
    sent_at_followup1: "Follow-up #1 sent date",
    sent_at_followup2: "Follow-up #2 sent date",
    sent_at_followup3: "Follow-up #3 sent date",
    };
    const label = labelMap[tsKey] || tsKey;
    const existingVal = row[tsKey] ? row[tsKey].slice(0, 16) : getLocalDatetimeString();
    openModal(`
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Edit send date</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">${escapeHtml(label)} — <strong>${escapeHtml(row.company_name || "this row")}</strong></p>
        </div>
        <button onclick="window.__closeModal()">Close</button>
        </div>
    </header>
    <div class="modal-grid" style="margin-top:16px;">
        <div class="full template-editor">
        <label class="tiny muted">${escapeHtml(label)}</label>
        <input type="datetime-local" id="tsEditInput" value="${escapeHtml(existingVal)}" style="font-size:15px;padding:12px;" />
        </div>
    </div>
    <div class="modal-actions">
        ${row[tsKey] ? `<button class="danger" id="clearTs">Clear date</button>` : ""}
        <button class="success" id="saveTs">Save</button>
    </div>`);
    document.getElementById("saveTs").onclick = () => {
    const val = document.getElementById("tsEditInput").value;
    if (!val) { toastMsg("Please select a date/time."); return; }
    row[tsKey] = new Date(val).toISOString();
    saveState();
    renderAll();
    closeModal();
    toastMsg("Date saved.");
    };
    const clearBtn = document.getElementById("clearTs");
    if (clearBtn) {
    clearBtn.onclick = () => {
        row[tsKey] = null;
        saveState();
        renderAll();
        closeModal();
        toastMsg("Date cleared.");
    };
    }
    window.__closeModal = closeModal;
}

function buildOptions(key, currentValue) {
    const list = state.lookupLists[key] || [];
    const current = String(currentValue ?? "");
    if (key === "status") {
    return STATUS_OPTIONS.map(opt => `<option value="${opt.value}" ${Number(current) === opt.value ? "selected" : ""}>${opt.value} — ${escapeHtml(opt.label)}</option>`).join("");
    }
    const hasCurrent = current && !list.includes(current);
    const items = [
    `<option value="">—</option>`,
    ...(hasCurrent ? [`<option value="${escapeHtml(current)}" selected>${escapeHtml(current)} (not in list)</option>`] : []),
    ...list.map(v => `<option value="${escapeHtml(v)}" ${current === v ? "selected" : ""}>${escapeHtml(v)}</option>`)
    ];
    return items.join("");
}

function renderAll() {
    renderVariableHints();
    renderLookupOverview();
    renderTemplateOverview();
    renderStats();
    renderFilterBar();
    renderGrid();
    saveState();
}

function addRow(sample = {}) {
    state.rows.push(normalizeRow({ ...sample }));
    activeFilter = "all";
    saveState();
    renderAll();
    setTimeout(() => {
        const rows = grid.querySelectorAll("tbody tr");
        if (rows.length) rows[rows.length - 1].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    toastMsg("New empty row added — fill in the details.");
}

const DEMO_ROWS = [
    {
        company_name: "Acme Studio",
        email: "hello@acme.example",
        contact_name: "Sara",
        position: "Marketing Manager",
        industry: "Software",
        category: "B2B",
        company_size: "11-50",
        proposed_idea: "Website optimization, lead generation, and email automation",
        status: 0,
        comments: "Warm lead from conference"
    },
    {
        company_name: "Northwind Foods",
        email: "info@northwind.example",
        contact_name: "",
        position: "",
        industry: "Manufacturing",
        category: "Enterprise",
        company_size: "201-1000",
        proposed_idea: "Operational workflow improvements and reporting automation",
        status: 0,
        comments: "General inbox"
    }
];

function fillDemoRows() {
    if (state.rows.length === 0) {
        DEMO_ROWS.forEach(r => state.rows.push(normalizeRow({ ...r })));
        activeFilter = "all";
        saveState();
        renderAll();
        toastMsg(`${DEMO_ROWS.length} sample rows added.`);
    } else {
        addRow();
    }
}

function editLookupList(key) {
    activeListKey = key;
    const values = state.lookupLists[key] || [];
    const html = `
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Edit lookup list: ${key.replaceAll("_", " ")}</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">This list powers dropdown values in the main sheet.</p>
        </div>
        <button onclick="window.__closeModal()">Close</button>
        </div>
    </header>
    <div class="section">
        <div id="lookupItems"></div>
        <div class="toolbar" style="margin-top:12px;">
        <button class="primary" id="addLookupItem">+ Add value</button>
        <button class="success" id="saveLookupItem">Save list</button>
        </div>
        <div class="footer-note">Tip: values can be reused immediately in the grid after saving.</div>
    </div>`;
    openModal(html);
    const listBox = document.getElementById("lookupItems");
    const renderItems = () => {
    listBox.innerHTML = values.map((v, idx) => `
        <div class="list-item">
        <input value="${escapeHtml(v)}" data-idx="${idx}" placeholder="Value" />
        <button class="danger" data-del-lookup="${idx}">Delete</button>
        </div>
    `).join("");
    listBox.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => { values[Number(inp.dataset.idx)] = inp.value; }));
    listBox.querySelectorAll("[data-del-lookup]").forEach(btn => btn.addEventListener("click", () => {
        values.splice(Number(btn.dataset.delLookup), 1);
        renderItems();
    }));
    };
    renderItems();
    document.getElementById("addLookupItem").onclick = () => { values.push(""); renderItems(); };
    document.getElementById("saveLookupItem").onclick = () => {
    state.lookupLists[key] = values.map(v => v.trim()).filter(Boolean);
    saveState();
    renderAll();
    closeModal();
    toastMsg("Lookup list saved");
    };
    window.__closeModal = closeModal;
}

function editTemplate(key) {
    const t = state.templates[key];
    const html = `
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Edit template: ${key}</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">Use placeholders such as {{company_name}}, {{contact_name | default: "there"}}, {{industry}}.</p>
        </div>
        <button onclick="window.__closeModal()">Close</button>
        </div>
    </header>
    <div class="modal-grid">
        <div class="full template-editor">
        <label class="tiny muted">Subject</label>
        <input id="tplSubject" value="${escapeHtml(t.subject)}" />
        </div>
        <div class="full template-editor">
        <label class="tiny muted">Body</label>
        <textarea id="tplBody">${escapeHtml(t.body)}</textarea>
        </div>
        <div class="full">
        <div class="hint-list">${getVariables().map(([k]) => `<span class="chip" data-ins="{{${k}}}">${k}</span>`).join("")}</div>
        </div>
    </div>
    <div class="modal-actions">
        <button class="success" id="saveTemplateBtn">Save template</button>
    </div>`;
    openModal(html);
    modalBody.querySelectorAll("[data-ins]").forEach(chip => chip.addEventListener("click", async () => {
    const val = chip.dataset.ins;
    const active = document.activeElement;
    if (active && (active.id === "tplSubject" || active.id === "tplBody")) {
        const start = active.selectionStart ?? active.value.length;
        const end = active.selectionEnd ?? active.value.length;
        active.value = active.value.slice(0, start) + val + active.value.slice(end);
        active.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        try { await navigator.clipboard.writeText(val); toastMsg(`Copied ${val}`); } catch { toastMsg(val); }
    }
    }));
    document.getElementById("saveTemplateBtn").onclick = () => {
    state.templates[key] = {
        subject: document.getElementById("tplSubject").value,
        body: document.getElementById("tplBody").value
    };
    saveState();
    renderAll();
    closeModal();
    toastMsg("Template saved");
    };
    window.__closeModal = closeModal;
}

function previewTemplate(key, rowIndex = 0) {
    const row = state.rows[rowIndex] || normalizeRow({});
    const t = state.templates[key];
    const subject = renderTemplateText(t.subject, row);
    const body = renderTemplateText(t.body, row);
    openModal(`
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Preview template: ${key}</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">Rendered using row #${rowIndex + 1}.</p>
        </div>
        <button onclick="window.__closeModal()">Close</button>
        </div>
    </header>
    <div class="section">
        <div class="tiny muted">Subject</div>
        <div style="font-size:15px;margin:6px 0 12px;">${escapeHtml(subject)}</div>
        <div class="tiny muted">Body</div>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:8px 0 0;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06);padding:12px;border-radius:10px;">${escapeHtml(body)}</pre>
    </div>
    <div class="modal-actions">
        <button class="primary" id="useForRow">Apply to row</button>
    </div>`);
    document.getElementById("useForRow").onclick = () => {
    const subjectField = key === "initial" ? "proposed_idea" : "comments";
    state.rows[rowIndex][subjectField] = state.rows[rowIndex][subjectField] || body.slice(0, 80);
    saveState();
    renderAll();
    closeModal();
    };
    window.__closeModal = closeModal;
}

function openTemplatePicker(rowIndex) {
    const options = Object.keys(state.templates).map(k => `<button class="primary" data-preview="${k}">${k}</button>`).join(" ");
    openModal(`
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Templates for row #${rowIndex + 1}</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">Preview, edit, or copy rendered content.</p>
        </div>
        <button onclick="window.__closeModal()">Close</button>
        </div>
    </header>
    <div class="toolbar" style="margin-bottom:14px;">${options}</div>
    <div class="section">
        <p class="help">Main workflows: initial email, follow-up #1, follow-up #2, final follow-up.</p>
        <div class="status-text">Statuses are mapped to pipeline steps. A richer sequence can be generated from the lookup columns.</div>
    </div>`);
    modalBody.querySelectorAll("[data-preview]").forEach(btn => btn.addEventListener("click", () => previewTemplate(btn.dataset.preview, rowIndex)));
    window.__closeModal = closeModal;
}

function renderTemplateText(text, row) {
    const vars = {
    company_name: row.company_name || "",
    your_name: state.settings.your_name || "",
    your_company_name: state.settings.company_name || "",
    contact_name: row.contact_name || "",
    position: row.position || "",
    industry: row.industry || "",
    category: row.category || "",
    company_size: row.company_size || "",
    proposed_idea: row.proposed_idea || "",
    email: row.email || "",
    status: String(row.status ?? ""),
    comments: row.comments || ""
    };
    return String(text).replace(/\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|\s*default:\s*"([^"]*)")?\s*\}\}/g, (_, key, fallback) => {
    const val = vars[key];
    if (val === undefined || val === null || val === "") return fallback ?? "";
    return String(val);
    });
}

function exportJson() {
    downloadFile("outreach-crm.json", "application/json", JSON.stringify(state, null, 2));
    toastMsg("JSON exported");
}

function downloadFile(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportXlsx() {
    const sheetjs = window.XLSX;
    if (!sheetjs) {
    toastMsg("XLSX library not loaded. Exporting JSON still works offline.");
    return;
    }
    const wb = sheetjs.utils.book_new();
    const rows = state.rows.map(r => ({
    "Company Name": r.company_name,
    "Email": r.email,
    "Contact Name": r.contact_name,
    "Position": r.position,
    "Industry Type": r.industry,
    "Company Category": r.category,
    "Company Size": r.company_size,
    "Proposed Idea": r.proposed_idea,
    "Status": statusLabel(r.status),
    "Sent At Initial": r.sent_at_initial ? formatDateShort(r.sent_at_initial) : "",
    "Sent At Followup1": r.sent_at_followup1 ? formatDateShort(r.sent_at_followup1) : "",
    "Sent At Followup2": r.sent_at_followup2 ? formatDateShort(r.sent_at_followup2) : "",
    "Sent At Followup3": r.sent_at_followup3 ? formatDateShort(r.sent_at_followup3) : "",
    "Comments": r.comments,
    }));
    const main = sheetjs.utils.json_to_sheet(rows);
    sheetjs.utils.book_append_sheet(wb, main, "Companies");
    Object.entries(state.lookupLists).forEach(([key, list]) => {
    const ws = sheetjs.utils.aoa_to_sheet([[key], ...list.map(v => [v])]);
    sheetjs.utils.book_append_sheet(wb, ws, key);
    });
    const templateRows = Object.entries(state.templates).map(([name, t]) => ({ sheet: name, subject: t.subject, body: t.body }));
    const tpl = sheetjs.utils.json_to_sheet(templateRows);
    sheetjs.utils.book_append_sheet(wb, tpl, "Templates");
    const settingsRows = Object.entries(state.settings).map(([k, v]) => ({ key: k, value: v }));
    const settingsWs = sheetjs.utils.json_to_sheet(settingsRows);
    sheetjs.utils.book_append_sheet(wb, settingsWs, "Settings");
    sheetjs.writeFile(wb, "outreach-crm.xlsx");
    toastMsg("XLSX exported");
}

function statusLabel(v) {
    const item = STATUS_OPTIONS.find(s => Number(s.value) === Number(v));
    return item ? item.label : String(v ?? "");
}

async function importFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    state = normalizeState(parsed);
    saveState();
    renderAll();
    toastMsg("Imported JSON");
    return;
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (!window.XLSX) {
        toastMsg("XLSX import requires a bundled SheetJS build. JSON import works offline.");
        return;
    }
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: "array" });
    const first = wb.Sheets[wb.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(first, { defval: "" });
    state.rows = rows.map(r => normalizeRow({
        company_name: r["Company Name"] ?? r["company_name"] ?? "",
        email: r["Email"] ?? r["email"] ?? "",
        contact_name: r["Contact Name"] ?? r["contact_name"] ?? "",
        position: r["Position"] ?? r["position"] ?? "",
        industry: r["Industry Type"] ?? r["industry"] ?? "",
        category: r["Company Category"] ?? r["category"] ?? "",
        company_size: r["Company Size"] ?? r["company_size"] ?? "",
        proposed_idea: r["Proposed Idea"] ?? r["proposed_idea"] ?? "",
        status: parseStatus(r["Status"] ?? r["status"]),
        comments: r["Comments"] ?? r["comments"] ?? "",
        sent_at_initial: r["Sent At Initial"] ?? r["sent_at_initial"] ?? null,
        sent_at_followup1: r["Sent At Followup1"] ?? r["sent_at_followup1"] ?? null,
        sent_at_followup2: r["Sent At Followup2"] ?? r["sent_at_followup2"] ?? null,
        sent_at_followup3: r["Sent At Followup3"] ?? r["sent_at_followup3"] ?? null,
    }));
    saveState();
    renderAll();
    toastMsg("Imported XLSX main sheet");
    return;
    }
    toastMsg("Unsupported file type");
}

function parseStatus(input) {
    const text = String(input ?? "").trim();
    if (text === "") return 0;
    const numeric = Number(text.split("—")[0].trim());
    if (Number.isFinite(numeric)) return numeric;
    const found = STATUS_OPTIONS.find(s => s.label.toLowerCase() === text.toLowerCase());
    return found ? found.value : 0;
}

function openSettings() {
    openModal(`
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Settings</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">General variables are used by templates and exports.</p>
        </div>
        <button onclick="window.__closeModal()">Close</button>
        </div>
    </header>
    <div class="modal-grid">
        <div class="template-editor">
        <label class="tiny muted">Your name</label>
        <input id="setYourName" value="${escapeHtml(state.settings.your_name)}" />
        </div>
        <div class="template-editor">
        <label class="tiny muted">Your company name</label>
        <input id="setCompanyName" value="${escapeHtml(state.settings.company_name)}" />
        </div>
        <div class="template-editor full">
        <label class="tiny muted">Default fallback for contact name</label>
        <input id="setDefaultContact" value="${escapeHtml(state.settings.default_contact_label)}" />
        </div>
    </div>
    <div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px;">Reminder thresholds <span class="muted" style="font-weight:400;">(days after sending before follow-up is due)</span></div>
        <div class="modal-grid">
        <div class="template-editor">
            <label class="tiny muted">Days after Initial email → Follow-up #1 due</label>
            <input type="number" min="1" id="setDaysInitial" value="${Number(state.settings.days_after_initial)}" />
        </div>
        <div class="template-editor">
            <label class="tiny muted">Days after Follow-up #1 → Follow-up #2 due</label>
            <input type="number" min="1" id="setDaysFU1" value="${Number(state.settings.days_after_followup1)}" />
        </div>
        <div class="template-editor">
            <label class="tiny muted">Days after Follow-up #2 → Follow-up #3 due</label>
            <input type="number" min="1" id="setDaysFU2" value="${Number(state.settings.days_after_followup2)}" />
        </div>
        <div class="template-editor">
            <label class="tiny muted">Days after Follow-up #3 → consider closed</label>
            <input type="number" min="1" id="setDaysFU3" value="${Number(state.settings.days_after_followup3)}" />
        </div>
        </div>
        <div class="footer-note" style="margin-top:10px;">
        <b>How it works:</b> When a row has status "Initial email sent" and the sent date is more than the configured days ago, the row is highlighted as <span style="color:#f87171;">overdue</span> and shown in the Overdue filter. <span style="color:#fbbf24;">Due soon</span> means it's within 1 day of the threshold.
        </div>
    </div>
    <div class="modal-actions">
        <button class="success" id="saveSettings">Save settings</button>
    </div>`);
    document.getElementById("saveSettings").onclick = () => {
    state.settings.your_name = document.getElementById("setYourName").value.trim();
    state.settings.company_name = document.getElementById("setCompanyName").value.trim();
    state.settings.default_contact_label = document.getElementById("setDefaultContact").value.trim() || "there";
    state.settings.days_after_initial = Math.max(1, Number(document.getElementById("setDaysInitial").value) || 5);
    state.settings.days_after_followup1 = Math.max(1, Number(document.getElementById("setDaysFU1").value) || 7);
    state.settings.days_after_followup2 = Math.max(1, Number(document.getElementById("setDaysFU2").value) || 7);
    state.settings.days_after_followup3 = Math.max(1, Number(document.getElementById("setDaysFU3").value) || 10);
    saveState();
    renderAll();
    closeModal();
    toastMsg("Settings saved");
    };
    window.__closeModal = closeModal;
}

function manageTemplates() {
    openModal(`
    <header>
        <div class="topbar">
        <div>
            <h1 style="margin:0;font-size:18px;">Template manager</h1>
            <p style="margin:4px 0 0;color:var(--muted);font-size:12px;">Edit the four outbound templates from one place.</p>
        </div>
        <button onclick="window.__closeModal()">Close</button>
        </div>
    </header>
    <div class="toolbar" style="margin-bottom:14px;">
        ${Object.keys(state.templates).map(k => `<button class="primary" data-edit-tpl="${k}">${k}</button>`).join("")}
    </div>
    <div class="section">
        <p class="help">Available variables are inserted with a click. Defaults are supported via <code>{{contact_name | default: "there"}}</code>.</p>
    </div>`);
    modalBody.querySelectorAll("[data-edit-tpl]").forEach(btn => btn.addEventListener("click", () => editTemplate(btn.dataset.editTpl)));
    window.__closeModal = closeModal;
}

function manageLookups() {
    editLookupList(activeListKey);
}

function resetAll() {
    if (!confirm("Reset all saved data and restore demo defaults?")) return;
    state = deepClone(DEFAULT_STATE);
    saveState();
    renderAll();
    toastMsg("Reset complete");
}

el("addRowBtn").addEventListener("click", () => addRow());
el("fillDemoBtn").addEventListener("click", fillDemoRows);
el("manageLookupsBtn").addEventListener("click", manageLookups);
el("manageTemplatesBtn").addEventListener("click", manageTemplates);
el("settingsBtn").addEventListener("click", openSettings);
el("exportJsonBtn").addEventListener("click", exportJson);
el("exportXlsxBtn").addEventListener("click", exportXlsx);
el("resetBtn").addEventListener("click", resetAll);
el("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
    await importFile(file);
    } catch (err) {
    console.error(err);
    toastMsg("Import failed");
    } finally {
    e.target.value = "";
    }
});

if (window.XLSX) {
    state.settings.enable_xlsx = true;
} else {
    state.settings.enable_xlsx = false;
}

renderAll();
