<picture>
  <source align="right" width="200" media="(prefers-color-scheme: dark)" srcset="https://kitconcept.com/kitconcept-white.svg">
  <img align="right" width="200" alt="kitconcept, GmbH" src="https://kitconcept.com/kitconcept-black.svg">
</picture>

> [!WARNING]
> If you reached here and you don't work at kitconcept, please refrain from using this package in production.
> There is a reason why we haven't opened it to the public and released it as an open-source package yet.
> This package is in early and heavy development and should be used with caution in production environments.
> It is subject to breaking changes and incomplete features and we won't support any upgrade step nor breaking change support whatsoever.

# volto-plate

<div align="center">

A Plone and Volto monorepo for experimenting with a Plate-powered wiki experience.

[![npm](https://img.shields.io/npm/v/@kitconcept/volto-plate)](https://www.npmjs.com/package/@kitconcept/volto-plate)
[![Code analysis checks](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml)
[![Acceptance tests](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml)
</div>

`volto-plate` is a Plone and Volto monorepo for experimenting with a Plate-powered wiki experience.

It combines:

- a backend package, `kitconcept.plate`
- a frontend add-on, `@kitconcept/volto-plate`
- a demo distribution that wires both sides together

The current project is centered around a dedicated `WikiPage` content type edited with a custom Wiki Editor built from the building blocks provided by Aurora's `@plone/plate`, plus a `Workspace` container type for organizing wiki content.

## Current feature set

### Content model

- `Workspace`: folderish container for wiki content, images, and files
- `WikiPage`: Plate-powered page type with Volto blocks storage
- example content profile that creates a browsable workspace tree for local development

### Editing experience

- `WikiPage` is registered as a Plate editor content type through `config.settings.PlateEditorContentTypes`
- custom Wiki Editor assembled from Aurora `@plone/plate` kits and plugins
- dedicated title block synced both ways with the Volto metadata title field
- block menu and slash commands for Plate blocks
- Volto-aware slash actions to create new Volto blocks and split the editor into separate Volto blocks
- custom `plateimage` block with width, alignment, and size controls
- image insertion from slash menu, clipboard paste, and drag and drop
- Volto-aware internal and external link handling
- floating toolbar customized for the wiki editor

### Rich text capabilities

- headings, paragraphs, lists, inline marks, alignment, and line-height controls
- code blocks, tables, toggles, table of contents, callouts, and columns
- mentions, comments, discussions, and suggestions
- Markdown and DOCX parsing support

### Backend integration

- backend serializers and deserializers for persisted Plate discussions
- permission `kitconcept.plate: Discuss content` for editing own discussion comments
- upgrade steps for the evolving workspace/wiki model

## Repository layout

- `backend/`: Plone package `kitconcept.plate`, site bootstrap, example content, upgrades, and tests
- `frontend/`: Volto workspace used to develop and test the add-on
- `frontend/packages/volto-plate/`: the actual frontend add-on source
- `frontend/aurora/`: local checkout used during development for `@plone/plate` and `@plone/helpers`
- `devops/`: container and stack support files

## Requirements

- `uv`
- `corepack` with `pnpm`
- Node.js `24`
- Python `3.12+`
- `make`
- Docker, if you want the local stack

## Local development

Clone the repository and install both parts:

```sh
git clone git@github.com:kitconcept/volto-plate.git
cd volto-plate
make install
```

`make install` installs the backend, creates the Plone site, installs the frontend workspace, and builds the local frontend dependencies.

Start the services in two terminals:

```sh
make backend-start
make frontend-start
```

The default local URLs are:

- backend: `http://localhost:8080`
- frontend: `http://localhost:3000`

If you need to recreate the Plone site:

```sh
make backend-create-site
```

## Local stack

For a containerized local stack:

```sh
make stack-create-site
make stack-start
```

This starts the demo at `http://volto-plate.localhost`.

## Testing and quality checks

Use the repository Make targets instead of ad-hoc commands.

### Main checks

```sh
make check
make test
```

### Backend

```sh
make backend-test
```

If you need a targeted backend test, use the backend virtualenv:

```sh
cd backend
.venv/bin/pytest tests/path_or_test.py
```

### Frontend

```sh
make frontend-test
```

### Acceptance tests

Acceptance coverage is Playwright-based and lives in `frontend/acceptance/tests`.

Start the backend:

```sh
make ci-acceptance-backend-start
```

Start the frontend in another terminal:

```sh
make acceptance-frontend-dev-start
```

Run the tests:

```sh
cd frontend
pnpm exec playwright test --reporter=list,html
```

## Formatting, linting, and i18n

```sh
make format
make lint
make i18n
```

## Changelog fragments

This repository uses towncrier fragments.

- backend changes: `backend/news/`
- frontend add-on changes: `frontend/packages/volto-plate/news/`
- repo-level changes: `news/`

Fragment types include `breaking`, `feature`, `bugfix`, `internal`, and `documentation`.

## Compatibility and status

- frontend add-on targets Volto `19+`
- backend metadata declares compatibility with Plone `6.1` and `6.2`
- the project is still alpha and the feature set is evolving quickly

## Related readmes

- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)
- [frontend/packages/volto-plate/README.md](./frontend/packages/volto-plate/README.md)
