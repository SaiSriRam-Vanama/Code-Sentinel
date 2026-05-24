# Code Sentinel

Code Sentinel is a lightweight code review and static-analysis orchestration project that integrates multiple analyzers and helper services to evaluate pull requests, surface security issues, and aid developer review.

## Key Features

- Orchestrates multiple analyzers (Bandit, Semgrep) for automated code scanning.
- Provides backend services for running analyzers and integrating with GitHub.
- Simple local development setup for backend (Python) and frontend (Vite + React/TypeScript).

## Repository Structure

- `backend/` — Python services and analyzers. Main entry points and helpers:
  - `main.py` — backend service entry.
  - `ai_review.py`, `github_service.py`, `list_models.py` — review and integrations.
  - `analyzers/` — runner modules (`bandit_runner.py`, `semgrep_runner.py`).
  - `database/` — lightweight DB layer (`database.py`, `models.py`).
- `frontend/` — Vite + React/TypeScript application for the UI.

## Architecture

Code Sentinel is organized into clear layers that separate concerns and make the system extensible and testable.

- **Frontend**: Vite + React/TypeScript app that provides the UI for dashboards and PR review results. It calls backend APIs to request scans and display findings.
- **Backend API & Orchestrator**: Python service (entry: `main.py`) that accepts requests or webhook events, coordinates analyzer runs, normalizes results, and interacts with the database and GitHub.
- **Analyzers**: Pluggable runner modules under `backend/analyzers/` (for example `bandit_runner.py` and `semgrep_runner.py`) that execute static-analysis tools and return structured findings.
- **Database / Persistence**: Lightweight models in `backend/database/` store scan metadata, results, and CI/PR state. This can be swapped for a full DB in production.
- **GitHub Integration**: `github_service.py` contains helpers to fetch PR data and post review comments or statuses.

Data flow (high level):

1. A PR event or manual request reaches the Backend (webhook or API).
2. The Backend schedules analyzer runs and invokes analyzer runners with repository code.
3. Each Analyzer returns findings to the Backend in a normalized format.
4. The Backend stores results in the Database and synthesizes a review summary.
5. The Backend updates the PR on GitHub (comments, statuses) and notifies the Frontend if needed.

Example system flow (Mermaid flowchart):

```mermaid
flowchart LR
  PR[Pull Request / Webhook] -->|HTTP| Backend[Backend API]
  Frontend -->|REST| Backend
  Backend -->|run| Analyzer[Analyzers (Bandit, Semgrep)]
  Analyzer -->|results| Backend
  Backend -->|store| Database[(Database)]
  Backend -->|post review| GitHub[GitHub API]
```

Extensibility notes:

- Add new analyzers by implementing a runner in `backend/analyzers/` and returning results in the established normalized schema.
- Swap or extend persistence by editing `backend/database/models.py` and connection logic in `backend/database/database.py`.

Security & privacy:

- The repository README intentionally omits any secrets, tokens, credentials, or private data. Keep deployment secrets out of source and supply them via environment variables or a secure vault.

## Requirements

- Python 3.10+ (recommended) for the backend.
- Node.js 18+ and npm/yarn for the frontend.

## Quickstart — Backend

1. Open a terminal and create a virtual environment inside `backend`:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

2. Run the backend service (example):

```powershell
python main.py
```

Notes:
- Backend modules include analyzer runners and GitHub integration helpers. Review `backend/` sources to understand available CLI/test helpers such as `test_pr_93936.py`.

## Quickstart — Frontend

1. Install dependencies and run the dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open the URL provided by Vite (usually `http://localhost:5173`).

## Development Notes

- Analyzer runners are placed in `backend/analyzers/`. To add or customize rules, edit or wrap these runner modules.
- Database models live in `backend/database/`; adjust persistence there if you add a real DB backend.
- The frontend communicates with backend APIs under `frontend/src/services/api.js` — update endpoints to match any backend routing changes.

## Contributing

- Fork the repository and open a pull request with focused changes.
- Add tests or small reproducible examples when changing analyzer behavior.
- Keep commits small and well-described.

## License

This project is released under the MIT License. See the `LICENSE` file for full text.

## Author / Contact

- Author: Sai Sri Ram Vanama
- LinkedIn: https://www.linkedin.com/in/saisriramv
- GitHub: https://github.com/SaiSriRam-Vanama