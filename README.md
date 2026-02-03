<picture>
  <source align="right" width="200" media="(prefers-color-scheme: dark)" srcset="https://kitconcept.com/kitconcept-white.svg">
  <img align="right" width="200" alt="kitconcept, GmbH" src="https://kitconcept.com/kitconcept-black.svg">
</picture>

# Volto Plate.js support (@kitconcept/volto-plate)

<div align="center">

An add-on that adds a [Plate.js](https://www.platejs.org/) support in Volto.

[![npm](https://img.shields.io/npm/v/@kitconcept/volto-plate)](https://www.npmjs.com/package/@kitconcept/volto-plate)
[![Code analysis checks](https://github.com/kitconcept/volto-plate/actions/workflows/code.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/code.yml)
[![Unit tests](https://github.com/kitconcept/volto-plate/actions/workflows/unit.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/unit.yml)
[![Acceptance tests](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/acceptance.yml)
</div>

## Features

This package provides support for the [Plate.js](https://www.platejs.org/) rich text editor in Volto, including:

-   A Volto block adapter to reuse existing Volto blocks inside Plate-based editors (e.g. rich text).
-   A Plate plugin to reuse the Volto Image block inside Plate-based editors.
-   A Plate-based Text block implementation for Volto, replacing the default Slate-based one.

It keeps in place the default Volto rich text block (slate-based) assumptions, so you can have multiple plate.js-based blocks in the same page.
However, pressing `ENTER` won't create a new block, instead, it will create a new paragraph inside the same block, as is standard behavior in rich text editors.
You can create new blocks using the block chooser as usual, and using the `/` slash command inside the `plate.js`-based block.


## Installation

To install your project, you must choose the method appropriate to your version of Volto.


### Volto 18 and later

Add `@kitconcept/volto-plate` to your `package.json`:

```json
"dependencies": {
    "@kitconcept/volto-plate": "*"
}
```

Add `@kitconcept/volto-plate` to your `volto.config.js`:

```javascript
const addons = ['@kitconcept/volto-plate'];
```

If this package provides a Volto theme, and you want to activate it, then add the following to your `volto.config.js`:

```javascript
const theme = '@kitconcept/volto-plate';
```

### Volto 17 and earlier

Create a new Volto project (you can skip this step if you already have one):

```
npm install -g yo @kitconcept/generator-volto
yo @kitconcept/volto my-volto-project --addon @kitconcept/volto-plate
cd my-volto-project
```

Add `@kitconcept/volto-plate` to your package.json:

```JSON
"addons": [
    "@kitconcept/volto-plate"
],

"dependencies": {
    "@kitconcept/volto-plate": "*"
}
```

Download and install the new add-on by running:

```
yarn install
```

Start volto with:

```
yarn start
```

## Test installation

Visit http://localhost:3000/ in a browser, login, and check the awesome new features.


## Development

The development of this add-on is done in isolation using a new approach using pnpm workspaces and latest `mrs-developer` and other Volto core improvements.
For this reason, it only works with pnpm and Volto 18 (currently in alpha).


### Prerequisites ✅

-   An [operating system](https://6.docs.plone.org/install/create-project-cookieplone.html#prerequisites-for-installation) that runs all the requirements mentioned.
-   [nvm](https://6.docs.plone.org/install/create-project-cookieplone.html#nvm)
-   [Node.js and pnpm](https://6.docs.plone.org/install/create-project.html#node-js) 22
-   [Make](https://6.docs.plone.org/install/create-project-cookieplone.html#make)
-   [Git](https://6.docs.plone.org/install/create-project-cookieplone.html#git)
-   [Docker](https://docs.docker.com/get-started/get-docker/) (optional)

### Installation 🔧

1.  Clone this repository, then change your working directory.

    ```shell
    git clone git@github.com:collective/volto-plate.git
    cd volto-plate
    ```

2.  Install this code base.

    ```shell
    make install
    ```


### Make convenience commands

Run `make help` to list the available commands.

```text
help                             Show this help
install                          Installs the add-on in a development environment
start                            Starts Volto, allowing reloading of the add-on during development
build                            Build a production bundle for distribution of the project with the add-on
i18n                             Sync i18n
ci-i18n                          Check if i18n is not synced
format                           Format codebase
lint                             Lint, or catch and remove problems, in code base
release                          Release the add-on on npmjs.org
release-dry-run                  Dry-run the release of the add-on on npmjs.org
test                             Run unit tests
ci-test                          Run unit tests in CI
backend-docker-start             Starts a Docker-based backend for development
storybook-start                  Start Storybook server on port 6006
storybook-build                  Build Storybook
acceptance-frontend-dev-start    Start acceptance frontend in development mode
acceptance-frontend-prod-start   Start acceptance frontend in production mode
acceptance-backend-start         Start backend acceptance server
ci-acceptance-backend-start      Start backend acceptance server in headless mode for CI
acceptance-test                  Start Cypress in interactive mode
ci-acceptance-test               Run cypress tests in headless mode for CI
```

### Development environment set up

Install package requirements.

```shell
make install
```

### Start developing

Start the backend.

```shell
make backend-docker-start
```

In a separate terminal session, start the frontend.

```shell
make start
```

### Lint code

Run ESlint, Prettier, and Stylelint in analyze mode.

```shell
make lint
```

### Format code

Run ESlint, Prettier, and Stylelint in fix mode.

```shell
make format
```

### i18n

Extract the i18n messages to locales.

```shell
make i18n
```

### Unit tests

Run unit tests.

```shell
make test
```

### Run Cypress tests

Run each of these steps in separate terminal sessions.

In the first session, start the frontend in development mode.

```shell
make acceptance-frontend-dev-start
```

In the second session, start the backend acceptance server.

```shell
make acceptance-backend-start
```

In the third session, start the Cypress interactive test runner.

```shell
make acceptance-test
```

## License

The project is licensed under the MIT license.

## Credits and acknowledgements 🙏

Generated using [Cookieplone (0.9.8)](https://github.com/plone/cookieplone) and [cookieplone-templates (1d2012a)](https://github.com/plone/cookieplone-templates/commit/1d2012a950e4374f91c3f93e9531fde44b330ab3) on 2025-09-23 09:45:10.835983. A special thanks to all contributors and supporters!
