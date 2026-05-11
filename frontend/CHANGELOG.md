# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.6 (2026-05-11)

### Bugfix

- Removed CSS container hack. @sneridagh 

## 1.0.0-alpha.5 (2026-05-08)

### Feature

- Add Navigation Portlet beside toolbar. @iFlameing 

### Internal

- During release, generate a tarball containing the package and its dependencies.@ericof 

## 1.0.0-alpha.4 (2026-05-07)

## 1.0.0-alpha.3 (2026-05-07)

## 1.0.0-alpha.2 (2026-05-07)

## 1.0.0-alpha.1 (2026-05-07)

### Feature

- Backend support for suggestions and comments. @sneridagh [#15](https://github.com/collective/volto-plate/issue/15)
- Add somersault sidebar editing support for Plate image blocks through the new `plateimage` block schema. @sneridagh 
- Show the Navigation portlet to display all child items contained within the page. @iFlameing 

### Bugfix

- Remove autosave feature completely.
  Other fixes. @sneridagh [#10](https://github.com/collective/volto-plate/issue/10)
- Fixed links styling. @sneridagh 

### Internal

- Add a Dockerfile to build the frontend container image, plus the supporting `make build-image` target and CI release job. @ericof 
- Pin `react`, `react-dom`, and `@types/react*` to 18.x in the catalog appended at Docker build time, so `react-intl` resolves to a single virtual instance and the `IntlProvider` context is shared across the bundle. @ericof 
- Update to Volto 19a28 and latest seven. @sneridagh 

### Documentation

- Fix typos in the README file for the package. @ericof 

## 1.0.0-alpha.0 (2026-02-03)
