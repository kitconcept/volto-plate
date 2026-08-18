<picture>
  <source align="right" width="200" media="(prefers-color-scheme: dark)" srcset="https://kitconcept.com/kitconcept-white.svg">
  <img align="right" width="200" alt="kitconcept, GmbH" src="https://kitconcept.com/kitconcept-black.svg">
</picture>

# Volto Plate.js support <br/>(@kitconcept/volto-plate)

<div align="center">

An add-on that adds a [Plate.js](https://www.platejs.org/) support in Volto.

[![npm](https://img.shields.io/npm/v/@kitconcept/volto-plate)](https://www.npmjs.com/package/@kitconcept/volto-plate)
[![CI](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml)
[![Acceptance tests](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml)
</div>

> [!WARNING]
> If you reached here and you are not part of the kitconcept team, please refrain from using this package in production.
> This package is in early and heavy development and should be used with caution in production environments.
> We are in the "make it work" phase and we are still figuring out the best way to implement the features we want to provide.
> Therefore, we can't guarantee that the package will be stable or that it will work as expected in all scenarios, and might contain technical debt, bugs, and incomplete features.
> It is subject to breaking changes and incomplete features and we won't support any upgrade step nor breaking change support whatsoever.

## Features

This package provides support for the [Plate.js](https://www.platejs.org/) rich text editor in Volto.

It provides "on-the-fly" conversion between Slate.js and Plate.js data models, allowing seamless integration of Plate.js-based blocks in Volto.
The conversion is only one-way: from Slate.js to Plate.js when loading data into the editor. Once in Plate.js, the data remains in Plate.js format.
In the future, we may considering adding a backend package providing scripts for batch converting back and forth between the two formats if needed.

Plate.js uses the concept of "blocks" that collide with the Volto ones. From now on, we will refer to Volto blocks as "Plone blocks" and Plate.js blocks as "Plate blocks" to avoid confusion.

From the user perspective, it provides:
-   A new editor based on Plone 7's `@plone/plate` library, the wiki-editor.
-   It can be used in any Plone content type, via a `config.settings.PlateEditorContentTypes` registry setting.
-   If set, it replaces the default Volto block editor engine with the wiki-editor.
-   Basic features using the inline floating toolbar, extending the default Volto one with experimental additions.
-   Slash commands to insert Plate blocks.
-   Ability to insert a Volto image block as a Plate image block (inline).

## Developer features

From the developer perspective, it provides:
-   A Volto block adapter to reuse existing Volto blocks inside Plate-based editors (e.g. rich text).
-   A Plate plugin to reuse the Volto Image block inside Plate-based editors.

## Compatibility

This package is only compatible with Volto 19 and later versions.

## Quick Start 🏁

### Prerequisites ✅

-   An [operating system](https://6.docs.plone.org/install/create-project-cookieplone.html#prerequisites-for-installation) that runs all the requirements mentioned.
-   [uv](https://6.docs.plone.org/install/create-project-cookieplone.html#uv)
-   [nvm](https://6.docs.plone.org/install/create-project-cookieplone.html#nvm)
-   [Node.js and pnpm](https://6.docs.plone.org/install/create-project.html#node-js) 24
-   [Make](https://6.docs.plone.org/install/create-project-cookieplone.html#make)
-   [Git](https://6.docs.plone.org/install/create-project-cookieplone.html#git)
-   [Docker](https://docs.docker.com/get-started/get-docker/) (optional)


### Installation 🔧

1.  Clone this repository, then change your working directory.

    ```shell
    git clone git@github.com:kitconcept/volto-plate.git
    cd volto-plate
    ```

2.  Install this code base.

    ```shell
    make install
    ```


### Fire Up the Servers 🔥

1.  Create a new Plone site on your first run.

    ```shell
    make backend-create-site
    ```

2.  Start the backend at http://localhost:8080/.

    ```shell
    make backend-start
    ```

3.  In a new shell session, start the frontend at http://localhost:3000/.

    ```shell
    make frontend-start
    ```

Voila! Your Plone site should be live and kicking! 🎉

### Local Stack Deployment 📦

Deploy a local Docker Compose environment that includes the following.

- Docker images for Backend and Frontend 🖼️
- A stack with a Traefik router and a PostgreSQL database 🗃️
- Accessible at [http://volto-plate.localhost](http://volto-plate.localhost) 🌐

Run the following commands in a shell session.

```shell
make stack-create-site
make stack-start
```

And... you're all set! Your Plone site is up and running locally! 🚀

## Project structure 🏗️

This monorepo consists of the following distinct sections:

- **backend**: Houses the API and Plone installation, utilizing pip instead of buildout, and includes a policy package named kitconcept.plate.
- **frontend**: Contains the React (Volto) package.
- **devops**: Encompasses Docker stack, Ansible playbooks, and cache settings.
- **docs**: Scaffold for writing documentation for your project.

### Why this structure? 🤔

- All necessary codebases to run the site are contained within the repository (excluding existing add-ons for Plone and React).
- Specific GitHub Workflows are triggered based on changes in each codebase (refer to .github/workflows).
- Simplifies the creation of Docker images for each codebase.
- Demonstrates Plone installation/setup without buildout.

## Code quality assurance 🧐

To check your code against quality standards, run the following shell command.

```shell
make check
```

### Format the codebase

To format and rewrite the code base, ensuring it adheres to quality standards, run the following shell command.

```shell
make format
```

| Section | Tool | Description | Configuration |
| --- | --- | --- | --- |
| backend | Ruff | Python code formatting, imports sorting  | [`backend/pyproject.toml`](./backend/pyproject.toml) |
| backend | `zpretty` | XML and ZCML formatting  | -- |
| frontend | ESLint | Fixes most common frontend issues | [`frontend/.eslintrc.js`](.frontend/.eslintrc.js) |
| frontend | prettier | Format JS and Typescript code  | [`frontend/.prettierrc`](.frontend/.prettierrc) |
| frontend | Stylelint | Format Styles (css, less, sass)  | [`frontend/.stylelintrc`](.frontend/.stylelintrc) |

Formatters can also be run within the `backend` or `frontend` folders.

### Linting the codebase
or `lint`:

 ```shell
make lint
```

| Section | Tool | Description | Configuration |
| --- | --- | --- | --- |
| backend | Ruff | Checks code formatting, imports sorting  | [`backend/pyproject.toml`](./backend/pyproject.toml) |
| backend | Pyroma | Checks Python package metadata  | -- |
| backend | check-python-versions | Checks Python version information  | -- |
| backend | `zpretty` | Checks XML and ZCML formatting  | -- |
| frontend | ESLint | Checks JS / Typescript lint | [`frontend/.eslintrc.js`](.frontend/.eslintrc.js) |
| frontend | prettier | Check JS / Typescript formatting  | [`frontend/.prettierrc`](.frontend/.prettierrc) |
| frontend | Stylelint | Check Styles (css, less, sass) formatting  | [`frontend/.stylelintrc`](.frontend/.stylelintrc) |

Linters can be run individually within the `backend` or `frontend` folders.

## Internationalization 🌐

Generate translation files for Plone and Volto with ease:

```shell
make i18n
```

## Credits and acknowledgements 🙏

Generated using [Cookieplone (0.9.10)](https://github.com/plone/cookieplone) and [cookieplone-templates (2c54630)](https://github.com/plone/cookieplone-templates/commit/2c5463046f43a87e36d11a7edc2b4176b2d593aa) on 2026-02-13 10:21:42.975825. A special thanks to all contributors and supporters!!
