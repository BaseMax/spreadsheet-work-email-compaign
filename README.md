# Outreach CRM Lite

A client-only, offline-first, template-driven outreach list manager built with pure HTML, CSS, and JavaScript. No server, no backend, no dependencies to install, just open `index.html` in a browser and start tracking your email campaigns.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **Offline-first** - all data is stored in browser `localStorage`, nothing leaves your machine.
- **Email sequence tracking** - manage up to four stages per contact: initial email, and three follow-ups.
- **Template engine** - write reusable email templates with `{{variable}}` placeholders and `{{field | default: "fallback"}}` syntax.
- **Lookup lists** - dropdown values for Industry, Category, Company Size, and Status are fully editable.
- **Smart filters** - quickly view all contacts, contacts needing action, or overdue contacts.
- **Statistics bar** - at-a-glance counts per status.
- **Export / Import** - export your data as JSON or XLSX; import back from JSON, XLSX, or XLS.
- **Demo data** - one-click sample rows and a reset button for a clean slate.
- **Dark UI** - polished dark theme, no external CSS framework required.

## Screenshot

> Open `index.html` in any modern browser - no build step needed.

## Getting Started

```bash
git clone https://github.com/BaseMax/spreadsheet-work-email-compaign.git
cd spreadsheet-work-email-compaign
# Open index.html in your browser
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

That's it. No `npm install`, no bundler, no server.

## Usage

### Managing contacts

| Column | Description |
|---|---|
| Company Name | Target company |
| Email | Contact email address |
| Contact Name | Person's name |
| Position | Job title / role |
| Industry | Lookup value |
| Category | Lookup value (B2B, B2C, …) |
| Company Size | Lookup value |
| Proposed Idea | Short pitch tailored to this contact |
| Status | Current stage in the outreach sequence |
| Comments | Internal notes |

### Email sequence statuses

| Value | Meaning |
|---|---|
| 0 | Waiting for initial email |
| 1 | Initial email sent |
| 2 | No reply - first follow-up |
| 3 | No reply - second follow-up |
| 4 | No reply - final follow-up |
| 5 | Replied / in progress |
| 6 | Closed / do not contact |

### Templates

Four built-in templates are provided (`initial`, `followup1`, `followup2`, `followup3`). Edit them freely via **Manage templates**. Supported placeholder syntax:

```
{{company_name}}
{{contact_name | default: "there"}}
{{your_name}}
{{your_company_name}}
{{position}}
{{industry}}
{{category}}
{{company_size}}
{{proposed_idea}}
```

### Settings

Click **Settings** to configure:

- Your name and company name (injected into templates).
- Default contact label fallback.
- Follow-up reminder intervals (days after each stage).
- XLSX export toggle.

### Export & Import

- **Export JSON** - downloads a full snapshot of all rows, templates, and settings.
- **Export XLSX** - downloads an Excel-compatible spreadsheet.
- **Import file** - accepts `.json`, `.xlsx`, or `.xls`. Merges/replaces the current dataset.

## File Structure

```
index.html          # Single-page application shell
script.js           # All application logic (~700 lines, vanilla JS)
style.css           # Dark theme styles
xlsx.full.min.js    # SheetJS library for XLSX read/write
```

## Browser Support

Any modern browser with `localStorage` and `Clipboard API` support (Chrome, Firefox, Edge, Safari).

## License

Copyright © 2026 Seyyed Ali Mohammadiyeh (Max Base)

See [LICENSE](LICENSE) for the full text.
