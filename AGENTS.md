# AGENTS.md

## Scope

These instructions apply to the whole `volto-plate` monorepo unless a deeper `AGENTS.md` overrides them.

## Repo Shape

- Monorepo with two main work areas:
- `backend/`: Plone policy package `kitconcept.plate`, managed with `uv`
- `frontend/`: Volto add-on workspace, managed with `pnpm`
- Prefer the repo `Makefile` targets over ad-hoc commands. The Makefiles already encode the supported bootstrap, test, lint, and acceptance flows.

- `frontend/aurora` is a local checkout of the Plone Aurora repository where the codebase for `@plone/plate` and `@plone/helpers` are developed. It is not a dependency of the main repo, but it is used for local development and testing of the frontend add-on. Ideally we should not change anything from this checkout, but if we do, we should make sure to keep it in sync with the upstream repository and ask for permission first.

## Required Tooling

- Python is managed through `uv`
- Node is expected to be `24`
- Package manager is `pnpm`
- `corepack` is the expected way to enable `pnpm`

## Bootstrap

Use the standard Make targets first.

- Full install:
  - `make install`
- Backend only:
  - `make backend-install`
  - This installs the backend virtualenv and creates the Plone site
- Frontend only:
  - `make frontend-install`

Common local dev flow:

- Terminal 1: `make backend-start`
- Terminal 2: `make frontend-start`

If a site is missing or needs to be recreated:

- `make backend-create-site`

## Testing

### Backend tests

Backend tests must follow the pattern in `backend/Makefile`.

- For the full backend suite, use:
  - `make -C backend test`
  - or from the repo root: `make backend-test`
- Do not run a global `pytest` binary for backend work
- Do not rely on ad-hoc `PYTHONPATH` hacks for backend tests
- If a targeted backend pytest invocation is necessary, use the backend virtualenv pytest, matching the Makefile pattern:
  - `cd backend && .venv/bin/pytest tests/path_or_test.py`

Reason:

- The backend test environment is expected to come from `backend/.venv`
- The repo already standardizes this through `backend/Makefile:test`

### Frontend tests

- Use `make -C frontend test`
- Or from the repo root: `make frontend-test`

### Acceptance tests

The repo acceptance flow is Playwright-based from `frontend/`.

- Start backend acceptance server only if it is not already started in port 55001:
  - `make ci-acceptance-backend-start`
- Start frontend for acceptance only if it is not already started in port 3000:
  - `make acceptance-frontend-dev-start`
- Run acceptance tests:
  - `cd frontend && pnpm exec playwright test --reporter=list,html`
- When running acceptance tests as an agent, launch Playwright unsandboxed on the first attempt. Do not try the sandboxed path first.

If you only need the standard interactive wrapper:

- `make acceptance-test`

## Formatting and Linting

Prefer Make targets before direct tool calls.

- Whole repo:
  - `make format`
  - `make lint`
  - `make check`
- Backend only:
  - `make -C backend format`
  - `make -C backend lint`
- Frontend only:
  - `make -C frontend format`
  - `make -C frontend lint`

Backend formatting/linting is driven by:

- `ruff`
- `zpretty`
- `pyroma`
- `check-python-versions`

Frontend formatting/linting is driven by:

- `eslint`
- `prettier`
- `stylelint`

## Change Scope Guidance

- Keep backend changes inside `backend/src/kitconcept/plate/` and `backend/tests/` unless broader plumbing is required
- Keep frontend changes inside `frontend/packages/volto-plate/` unless the workspace config or app shell must change
- Preserve existing Makefile-driven workflows instead of introducing one-off local command conventions
- Follow existing naming and test placement patterns already present in the touched package

## Changelog Fragments

This repo checks for towncrier fragments in CI.

- Backend changes need a fragment under `backend/news/`
- Frontend add-on changes need a fragment under `frontend/packages/volto-plate/news/`
- Repo-level (not related to `backend` or `frontend`) changes may need a fragment under the root `news/`

Use the fragment type that matches the change, such as:

- `feature`
- `bugfix`
- `internal`
- `documentation`
- `breaking`

## CI Awareness

- Backend CI runs lint, test matrix, and coverage
- Frontend CI runs code analysis, i18n, unit tests, and image build
- Acceptance CI installs both sides, starts the backend and frontend, then runs Playwright
- Prefer commands that mirror CI behavior when validating changes locally

## Practical Rules For Agents

- Start with the narrowest validation that still exercises the changed area
- After meaningful code changes, run the relevant scoped tests using the repo-sanctioned command path
- For backend validation, prefer `make -C backend test` or `backend/.venv/bin/pytest`, never global `pytest`
- For frontend validation, prefer `make -C frontend test` or the package scripts behind it
- For Playwright acceptance validation, request unsandboxed execution immediately instead of retrying after a sandbox failure
- For all changes made, run the full repo `make check` to ensure all formatting and linting is satisfied
- If a command fails because dependencies are not installed yet, bootstrap with the corresponding Make target instead of working around the environment manually
