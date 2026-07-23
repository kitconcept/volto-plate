<picture>
  <source align="right" width="200" media="(prefers-color-scheme: dark)" srcset="https://kitconcept.com/kitconcept-white.svg">
  <img align="right" width="200" alt="kitconcept, GmbH" src="https://kitconcept.com/kitconcept-black.svg">
</picture>

> [!WARNING]
> If you reached here and you are not part of the kitconcept team, please refrain from using this package in production.
> There is a reason why we haven't opened it to the public and released it as an open-source package yet.
> This package is in early and heavy development and should be used with caution in production environments.
> We are in the "make it work" phase and we are still figuring out the best way to implement the features we want to provide.
> Therefore, we can't guarantee that the package will be stable or that it will work as expected in all scenarios, and might contain technical debt, bugs, and incomplete features.
> It is subject to breaking changes and incomplete features and we won't support any upgrade step nor breaking change support whatsoever.

# volto-plate

<div align="center">

A Plone and Volto monorepo for experimenting with a Plate-powered Plone content experience.

[![npm](https://img.shields.io/npm/v/@kitconcept/volto-plate)](https://www.npmjs.com/package/@kitconcept/volto-plate)
[![Code analysis checks](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml)
[![Acceptance tests](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml)
</div>

It combines:

- a backend package, `kitconcept.plate`
- a frontend add-on, `@kitconcept/volto-plate`
- a demo distribution that wires both sides together

The current project is centered around a dedicated `WikiPage` content type edited with a custom Wiki Editor built from the building blocks provided by Aurora's `@plone/plate`, plus a `Workspace` container type for organizing wiki content.

## Demo

It can be tested in:

https://plate.kitconcept.dev/

and in the kitconcept intranet distribution integration:

https://plone-intranet.kitconcept.dev/

## Vision

This package vision is to provide a new block editor experience for Plone (Wiki Editor), based on the Plate editor and its building blocks, that can be used to create rich content types like wikis, knowledge bases, and other collaborative content experiences.

It leverages the existing Plone and Volto infrastructure, along with the `@plone/plate` library used in Plone Aurora.
It is **not** a replacement for the default blocks editor in Plone Volto, the default blocks editor experience remains in place.
Thus, it does not provide a migration path from the default blocks editor to the new editor, and it does not provide a way to convert existing content from the default blocks editor to the new editor.
It is thought to be used alongside the existing blocks experience, enabling the new editor to be used for specific content types.
It is an experiment to explore new ways of creating and managing content in Plone.

Since it uses `@plone/plate`, while we develop it, we will also contribute to the upstream project and help improve the Plate editor and its building blocks.
However, this entails some considerations that we need to keep in mind as explained in the next section.

## Developing `@kitconcept/volto-plate`

When developing `@kitconcept/volto-plate`, we have to keep in mind the three scenarios that we are dealing with:

### `@plone/plate` development

A checkout of `Plone Aurora` is included in the repo under `frontend/aurora`, which is used for local development and testing of the frontend add-on.
We are developing `@plone/plate` at the same time (if needed) that we are developing `@kitconcept/volto-plate`.
We should avoid changing anything in this checkout, only if it makes sense or the feature that we are building will be shared between Aurora and volto-plate.
But if we do, we should make sure to keep it in sync with the upstream repository and that everything is tested and keeps working in Plone Aurora as expected.
For any changes merged, we should also release `@plone/plate` and `@plone/helpers` to npm.
Afterwards, when we release a new version of `@kitconcept/volto-plate`, the updated versions of `@plone/plate` and `@plone/helpers` will make it into the release.

### Local development of `@kitconcept/volto-plate`

We are developing `@kitconcept/volto-plate` using the `@plone/plate` library.
We reuse a good amount of code and modules (plugins, UI components, etc) in the libraries, but for some specific features, specially the ones that refer to specific Volto things, we have to implement them in `@kitconcept/volto-plate` and not in the libraries.
We do that by shadowing the libraries modules in the local add-on, or by creating new plugins that work for Volto and uses Volto specifics (API, Redux, etc.).
You can find the shadows in the usual `customizations` folder in the add-on.
We also developed custom plugins for the editor that are specific to the Volto experience, and that are not part of the libraries.

We created a customization of the default Aurora blocks editor: The Wiki Editor, which is a custom editor that uses the building blocks provided by `@plone/plate` and adds some custom plugins and features to provide a better experience for editing `WikiPage` content in Plone Volto.
Its shape (presets and kits) resembles the default Aurora editor for convenience, and shows the way to create a custom editor (both for Volto and Aurora), while reusing the existing building blocks provided by `@plone/plate`.

The backend package `kitconcept.plate` provides the backend support for the frontend add-on, including serializers and deserializers for persisted Plate discussions, and a permission to allow users to edit their own discussion comments.
It also provides the Workspace and WikiPage content types, and the Wiki editor is wired to the WikiPage content type through the `config.settings.PlateEditorContentTypes` setting.

### Integrating `@kitconcept/volto-plate`/`kitconcept.voltoplate` in a project

You can use the add-ons `@kitconcept/volto-plate`/`kitconcept.voltoplate` in your project by installing them as dependencies and configuring them in your Plone project.
This will make the Workspace and the WikiPage content type available in your project, and the Wiki Editor will be used to edit it.
There might be some additional configuration needed to make it work, depending on your project setup and requirements, like the mentions and comments features, which require some additional configuration in the backend and frontend to work properly.
e.g., if you want that the mentions work with a specific set of users (like `collective.person` content types) you should enable this by overriding the services and deserializers in the add-on.

Then we have a three level of customizations in place, each of one applies to a different scenario that allows generalistic set of features to be developed in the libraries, and specific features to be developed in the add-on, and finally project specific features to be developed in the project.

## Releasing `@kitconcept/volto-plate`

We use `repoplone` for that, to release both the backend and frontend parts of the package.
The process already creates an artifact for the backend and frontend packages, and pushes it to the repository.

```bash
uvx repoplone release
```

### Updating `@kitconcept/volto-plate` in your project

The only project that uses this package is the kitconcept intranet distribution, which has a script locally to update `@kitconcept/volto-plate` to the latest version.

```bash
# in the kitconcept intranet distribution repo
# update the package to the latest version
make update-volto-plate
```

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
