# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.31 (2026-10-05)


### Feature

- Keep the images of content pasted from Word, LibreOffice or a web page as image blocks. Images that come with the clipboard and images from other sites are uploaded as Image content, images of the site point at their Image content. @sneridagh 
- Pasted content from Word, LibreOffice or a web page takes the styles of the wiki page: fonts, sizes, colors, alignment, spacing and table looks are dropped, while headings, lists, tables, links, images and marks like bold or italic stay. @sneridagh 
- The title of pasted content becomes the title of the wiki page: the paragraph in the Title style of a Word or LibreOffice document, or else the first H1, from HTML or markdown. The H1s left become H2s. @sneridagh 

## 1.0.0-alpha.30 (2026-10-01)


### Feature

- Added Cut, Copy and Paste to the block context menu, by upgrading to `@plone/plate` 1.0.0-alpha.20 (Aurora 1.0.0-alpha.14). @sneridagh 
- Pasting an image copied from a web page (for example with "Copy image") now uploads it and inserts an image block, like pasting an image file. @sneridagh 


### Bugfix

- Fixed dragging an image block in the editor deleting it instead of moving it, by upgrading to `@plone/plate` 1.0.0-alpha.19 (Aurora 1.0.0-alpha.13). @sneridagh 
- Fixed pasted or dropped images showing broken in the editor until the page was saved: the image block now stores the image scales returned by the upload, as Volto's image widget does. @sneridagh 
- Fixed the caret sliding into place with an animation after pressing Enter on the last paragraph in edit mode, caused by the Volto Light Theme padding transition. @sneridagh 
- Fixed the default block width not being stored for code blocks, tables, callouts, tables of contents, columns and other native blocks, which made the history diff show a width change nobody made. @sneridagh 


### Internal

- Use VLT 8 final. @sneridagh 

## 1.0.0-alpha.29 (2026-09-30)


### Breaking

- Upgraded to `@plone/plate` 1.0.0-alpha.18 (Aurora 1.0.0-alpha.12) and Plate.js 53.x. Static rendering helpers (`SlateElement`, `SlateElementProps`) are now imported from `platejs/static`. Markdown shortcuts are configured as `inputRules` on each kit, including links (markdown links and autolink on paste, space and enter). Blockquotes are now containers of blocks: legacy flat blockquotes are normalized when loaded in the editor. The `basic-blocks-kit.tsx` shadow was removed in favor of upstream's kit, so the editor no longer offers H1, which is reserved for the title. @sneridagh 


### Feature

- Added the `# ` markdown shortcut from `@plone/plate` to the title block: it restores the title block when the document has none, like the "Title" slash menu item. @sneridagh 


### Bugfix

- Added an accessible name to the toggle button in the public view, like the one in the editor. @sneridagh 
- Fixed editing an existing link via Browse or a search result replacing the link text; only the link target is updated now. @sneridagh 
- Fixed the caret jumping out of a restored title block when it is filled with the page title. @sneridagh 


### Internal

- Pin Aurora to 1.0.0-alpha.10 @sneridagh 
- Removed the `turn-into-toolbar-button.tsx` shadow and the Heading 5/6 slash menu items, now that `@plone/plate` offers Heading 5 and Heading 6 in its menus. @sneridagh 


### Tests

- Added acceptance tests for the native blocks of the wiki presets, in the editor and the public view: block interactions, slash menu, floating toolbar, block context menu and Word, HTML and markdown paste, with programmatic test page fixtures. @sneridagh 

## 1.0.0-alpha.28 (2026-09-16)


### Bugfix

- Fix toggle blocks in view mode @iRohitSingh [#77](https://github.com/kitconcept/volto-plate/issues/77)
- Fixed long unbroken words (e.g. a URL or a string with no spaces) overflowing the comment box instead of wrapping inside it. @iFlameing 
- Fixed the @mention popover so arrow key navigation actually highlights the selected person, instead of looking like it does nothing. @iFlameing 


### Internal

- Added acceptance tests for selecting @mentions with a click and with arrow keys + Enter, both in the document editor and in a new comment, using two test users. @iFlameing 

## 1.0.0-alpha.27 (2026-09-11)


### Internal

- Use @plone/plate@1.0.0-alpha.15 @sneridagh 

## 1.0.0-alpha.26 (2026-09-11)


### Internal

- Add CI check enforcing the mandatory OVERRIDE documentation header on every shadowed component under `src/customizations` @sneridagh [#shadow-headers](https://github.com/kitconcept/volto-plate/issues/shadow-headers)
- Added OVERRIDE header comments (reason, upstream file link, developer, changelog) to the shadowed/customized files under `src/customizations`. @iFlameing 
- check-shadow-headers now skips asset files (.svg, images) that cannot carry a JS block comment. 

## 1.0.0-alpha.25 (2026-09-09)


### Bugfix

- Fix spacing after mention and calendar date pills @iRohitSingh [#spacing](https://github.com/kitconcept/volto-plate/issues/spacing)
- Fix missing save button in users controlpanel @iRohitSingh [#54](https://github.com/kitconcept/volto-plate/issues/54)
- Fix inline comments css @iRohitSingh [#59](https://github.com/kitconcept/volto-plate/issues/59)

## 1.0.0-alpha.24 (2026-08-27)


### Feature

- Added a clear formatting button to the wiki page toolbar. @iFlameing 


### Bugfix

- Avatar Fallback for personPill @iRohitSingh [#AvatarFallback](https://github.com/kitconcept/volto-plate/issues/AvatarFallback)

## 1.0.0-alpha.23 (2026-08-18)


### Feature

- Added Accept all and Reject all buttons in the suggestions popover when there is more than one open suggestion. @iFlameing 


### Internal

- Dropped the `artifact-release` script and the checked-in package tarball, now that the package is published to npm. @ericof 
- Switched the release hooks from `pipx` to `uvx`, vendored the changelog template instead of reading it from `node_modules`, and fixed the changelog issue link format, which pointed at the wrong repository and returned a 404 for every linked entry. @ericof 

## 1.0.0-alpha.22 (2026-07-28)

### Feature

- Added a `//` slash command in the wiki editor that opens a date picker to insert dates. @iFlameing 
- Added a `belowContentTitle` slot below the document title block so custom components can be rendered there. @iFlameing 
- Added the PersonPill component, ported from kitconcept.intranet, and used it for the @mention chip and the comments/suggestions avatars instead of first-letter initials. @iFlameing 
- Image zoom feature @Tishasoumya-02 
- Typography using shadcn/typography approach. Continue the typography implementation: heading scale, colour palette, links, lists and block flow spacing. Further iterations to follow. @sneridagh @danalvrz 

### Bugfix

- Fix Cursor position in add/edit mode @iRohitSingh [#50](https://github.com/collective/volto-plate/issue/50)

## 1.0.0-alpha.21 (2026-07-22)

### Feature

- Add Plone user mentions with portraits in Plate text and discussion comments. [#mentions](https://github.com/collective/volto-plate/issue/mentions)

## 1.0.0-alpha.20 (2026-07-17)

### Feature

- Add read-only comment and suggestion popovers to the wiki renderer, with the correct inline suggestion colours and per-mark popover targeting, and fix an editor normalization error when saving with active suggestions. [#comment-renderer-support](https://github.com/collective/volto-plate/issue/comment-renderer-support)

## 1.0.0-alpha.19 (2026-07-08)

### Bugfix

- Fixed login screen CSS. @sneridagh 

## 1.0.0-alpha.18 (2026-07-06)

### Bugfix

- Fix for tables and SemanticUI .fixed and other collisions. @sneridagh 

## 1.0.0-alpha.17 (2026-07-06)

## 1.0.0-alpha.16 (2026-07-06)

### Breaking

- Moved the navigation tree component to the distribution. @sneridagh 

## 1.0.0-alpha.15 (2026-07-03)

### Feature

- Add workspace switcher and workspace-scoped navigation tree to the NavigationTree panel. @iFlameing 

### Bugfix

- Fix inherit logic. @sneridagh [#44](https://github.com/collective/volto-plate/issue/44)

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
