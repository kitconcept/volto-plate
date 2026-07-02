# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.14 (2026-07-02)

### Internal

- Missing @plone/plate updates. @sneridagh 

## 1.0.0-alpha.13 (2026-07-02)

### Internal

- Removed the aurora clone step when running `make clean`. @ericof 

## 1.0.0-alpha.12 (2026-07-02)

## 1.0.0-alpha.11 (2026-07-01)

## 1.0.0-alpha.10 (2026-07-01)

### Feature

- Adapt to style fields from @plone/plate. @sneridagh 
- Add Navigation tree. @iFlameing 
- Clipboard image paste in the wiki editor now uploads through Volto's `createContent` action and inserts a `plateimage` block pointing to the created Image object, while removing the unused generic Plate media kit wiring from that editor. 
- Dragging image files from the desktop into the wiki Plate editor now uploads them through Volto's `createContent` action and inserts `plateimage` blocks, with edit and add views following the same target resolution rules as image paste. 
- Refactored wiki editor images to use dedicated `plateimage` ploneBlock rendering, schema-driven styled fields, and semantic `data-style-*` hooks instead of the old native Plate image adapter path. @sneridagh 

### Bugfix

- Adapt to use @plone/aurora. @sneridagh [#31](https://github.com/collective/volto-plate/issue/31)
- Kept the wiki editor floating toolbar above Volto chrome by using a local portaled toolbar with Volto-aware positioning. [#33](https://github.com/collective/volto-plate/issue/33)
- Disabled the floating formatting toolbar for the title block and kept title content normalized to plain text. [#34](https://github.com/collective/volto-plate/issue/34)
- Moved the slash menu Image entry to appear directly after the paragraph option. [#35](https://github.com/collective/volto-plate/issue/35)
- Fix misalignment when we have longer titles. @iFlameing 
- Hide navigation sidebar when printing Wiki pages to remove unwanted blank space on the left. @iFlameing 
- Reverted the decision to have the images as a non-native Plate plugin.
  The Image block in this add-on is a full fledged Plate plugin piggy-backing in the original Plate Image plugin, but that exposes the Volto Image block.
  This keeps the things simple since the Wiki-editor does not use any other Volto block. @sneridagh 

## 1.0.0-alpha.9 (2026-05-28)

### Bugfix

- Fix the unwanted navigation path in nested workspace. @iFlameing 

## 1.0.0-alpha.8 (2026-05-14)

## 1.0.0-alpha.7 (2026-05-13)

### Bugfix

- - Fixed an issue where the first-level navigation was not shown for the active page.
  - Added persistence for navigation open/close preferences using localStorage.
  - Use the nearest Workspace ancestor as the navigation root to display the complete navigation tree. @iFlameing 
- Fix CSS for containers. @sneridagh 

### Internal

- Playwright test for bold, italics and striketrough toolbar options. @iFlameing 

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
