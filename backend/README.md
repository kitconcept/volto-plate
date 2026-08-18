<picture>
  <source align="right" width="200" media="(prefers-color-scheme: dark)" srcset="https://kitconcept.com/kitconcept-white.svg">
  <img align="right" width="200" alt="kitconcept, GmbH" src="https://kitconcept.com/kitconcept-black.svg">
</picture>

# Volto Plate.js support <br/>(kitconcept.plate)

<div align="center">

The Plone backend support for [`@kitconcept/volto-plate`](https://www.npmjs.com/package/@kitconcept/volto-plate), the [Plate.js](https://www.platejs.org/) editor add-on for Volto.

[![Built with Cookieplone](https://img.shields.io/badge/built%20with-Cookieplone-0083be.svg?logo=cookiecutter)](https://github.com/plone/cookieplone-templates/)

[![PyPI](https://img.shields.io/pypi/v/kitconcept.plate)](https://pypi.org/project/kitconcept.plate/)
[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/kitconcept.plate)](https://pypi.org/project/kitconcept.plate/)
[![PyPI - Plone Versions](https://img.shields.io/pypi/frameworkversions/plone/kitconcept.plate)](https://pypi.org/project/kitconcept.plate/)

[![GitHub contributors](https://img.shields.io/github/contributors/kitconcept/volto-plate)](https://github.com/kitconcept/volto-plate)
[![GitHub Repo stars](https://img.shields.io/github/stars/kitconcept/volto-plate?style=social)](https://github.com/kitconcept/volto-plate)

[![Code analysis checks](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml/badge.svg)](https://github.com/kitconcept/volto-plate/actions/workflows/main.yml)

</div>

> [!WARNING]
> If you reached here and you are not part of the kitconcept team, please refrain from using this package in production.
> This package is in early and heavy development and should be used with caution in production environments.
> We are in the "make it work" phase and we are still figuring out the best way to implement the features we want to provide.
> Therefore, we can't guarantee that the package will be stable or that it will work as expected in all scenarios, and might contain technical debt, bugs, and incomplete features.
> It is subject to breaking changes and incomplete features and we won't support any upgrade step nor breaking change support whatsoever.

## Features

### Content types

- `Workspace`: a folderish container for wiki content, images, and files, marked by the `IWorkspaceMarker` behavior
- `WikiPage`: a Plate-powered page type storing Volto blocks

### Discussions

- serializers and deserializers for Plate discussions persisted as Plone comments
- the `kitconcept.plate: Discuss content` permission, allowing users to add and edit their own comments in Plate editor discussions

### Mentions

- a `@mentions` REST API endpoint backing the editor's user mentions

### Other

- an install profile depending on `plone.volto`, plus an uninstall profile
- translations for English, German, Spanish, Italian, and Brazilian Portuguese

## Installation

Install kitconcept.plate with uv.

```shell
uv add kitconcept.plate
```

Create the Plone site.

```shell
make create-site
```

## Contribute

- [Issue tracker](https://github.com/kitconcept/volto-plate/issues)
- [Source code](https://github.com/kitconcept/volto-plate/)

### Prerequisites ✅

-   An [operating system](https://6.docs.plone.org/install/create-project-cookieplone.html#prerequisites-for-installation) that runs all the requirements mentioned.
-   [uv](https://6.docs.plone.org/install/create-project-cookieplone.html#uv)
-   [Make](https://6.docs.plone.org/install/create-project-cookieplone.html#make)
-   [Git](https://6.docs.plone.org/install/create-project-cookieplone.html#git)
-   [Docker](https://docs.docker.com/get-started/get-docker/) (optional)

### Installation 🔧

1.  Clone this repository.

    ```shell
    git clone git@github.com:kitconcept/volto-plate.git
    cd volto-plate/backend
    ```

2.  Install this code base.

    ```shell
    make install
    ```


## License

The project is licensed under GPLv2.

## Credits and acknowledgements 🙏

Generated using [Cookieplone (2.0.0b3)](https://github.com/plone/cookieplone) and [cookieplone-templates (6bdd1ef)](https://github.com/plone/cookieplone-templates/commit/6bdd1efa3642c65710a3373c00637f50aca2b145) on 2026-06-25 19:10:07.781846. A special thanks to all contributors and supporters!
