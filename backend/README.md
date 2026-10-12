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

### Inline Tasks

Todos in `blocks.__somersault__.value` are cataloged as `Inline Task` entries.
The document is their authoritative storage: `taskId`, `taskCreator`,
`taskCreated`, `taskModified`, and `taskCompleted` are stamped server-side.
Transient task objects resolve at `<page>/++tasks++items/<taskId>`; no task
objects are persisted separately. Completing a todo records a UTC timestamp;
reopening it removes that timestamp.

Catalog `UID` values are `<page UID>:<taskId>`. The same node UUID pasted into
another page therefore gets a distinct catalog identity without a collision
query or indexing-queue flush. Traversal still uses only the node's `taskId`.

`task_assignees` contains all mentioned user IDs, falling back to the original
creator. `task_due_date` is the first valid inline calendar date, indexed at midnight
UTC. Missing due dates are indexed as `4000-01-01T00:00:00Z`, a sentinel within
DateIndex's integer range, so sorting on `task_due_date` puts undated tasks last.
`task_completed` is a date index; `task_status` is its derived
`open`/`completed` query counterpart. `task_assignees` is index-only; the four
additional metadata columns are `task_due_date`, `task_completed`, and `task_status`.
`task_source_title` is available through `metadata_fields` but resolved from the
live task object, so page title changes require no task recataloging.

The frontend's `/my-tasks` route uses the existing site-root
`POST @querystring-search` endpoint with this request body:

```json
{
  "query": [
    {"i": "portal_type", "o": "plone.app.querystring.operation.selection.any", "v": ["Inline Task"]},
    {"i": "task_assignees", "o": "plone.app.querystring.operation.string.currentUser"},
    {"i": "task_status", "o": "plone.app.querystring.operation.selection.any", "v": ["open"]}
  ],
  "sort_on": "task_due_date",
  "sort_order": "ascending",
  "b_start": 0,
  "b_size": 25,
  "metadata_fields": ["UID", "task_due_date", "task_source_title"]
}
```

Results use standard `items`, `items_total`, and `batching` keys and inherit page
visibility. Render the sentinel as missing; display the calendar-date portion of
`task_due_date` without timezone conversion, and use the browser timezone for today.
Derive the containing page URL by removing `/++tasks++items/<UUID>` from `@id`.
REST deserialization compares old/new task projections and queues only changed
entries for catalog updates after the page is saved. Removing the entire block
also removes its task entries. Catalog refreshes resolve already indexed tasks;
discovery during a full clear-and-rebuild is deferred.
Existing sites
must run profile upgrade `20261012001` to install the indexes and backfill todos;
unknown historical task creators fall back to page creators, and historical
completion times are approximated by migration time.

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
