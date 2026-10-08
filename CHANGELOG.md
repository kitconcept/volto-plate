# Change log

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->
## 1.0.0a35 (2026-10-08)

### Backend


#### New features:

- Resolving an inline comment thread archives it instead of removing it: the server records who resolved it and when, and clears that again when the thread is reopened. @iFlameing 


#### Bug fixes:

- Allow anonymous users to retrieve user info for mentions. @davisagli 



### Frontend


#### Breaking

- Removed the toggle plugin from the wiki editor: it is no longer offered in the slash menu, the floating toolbar or the "Turn into" menu, and the `@platejs/toggle` dependency was dropped. @sneridagh 


#### Feature

- Resolved comment threads stay in the text and can be reopened: a "Resolve" button in the thread header, a "Resolved by …" banner with "Reopen", a muted highlight and a check icon on blocks whose threads are all resolved. @iFlameing 


#### Bugfix

- Fix comment and suggestion popovers: drop the draft comment highlight on click outside, clear the active suggestion when closing the popover, and keep the popover anchored after the block re-renders. @Tishasoumya-02 
- Remove the Mermaid "Syntax error in text" graphics that leaked onto the page when a diagram had invalid source. @sneridagh 
- Restore the editor focus when a draft comment is dropped: the cursor goes to the click position inside the editor, or to the end of the commented selection when clicking outside it or pressing Escape. @Tishasoumya-02 
- Simplify loading of portraits in PersonPill component.
  (Assume it is correctly passed the portrait URL, instead of trying to detect
  whether it loaded.)
  @davisagli 



### Project

No significant changes.




## 1.0.0a34 (2026-10-06)

### Backend

No significant changes.




### Frontend


#### Feature

- Added `scripts/plate-i18n.mjs` to the `i18n` script, which brings `@plone/plate`'s translation keys into the add-on's gettext catalogs and fills them from Plate's translations, and made the date picker strings translatable. @sneridagh 


#### Bugfix

- Wiki editor sidebar: follow the selected block like the regular Volto editor, opening the Block tab for blocks whose config sets `sidebarTab` (e.g. images) and the Document tab for every other block, and hide the unused Order tab. @sneridagh 


#### Internal

- Upgraded `@plone/plate` to Plone Aurora `1.0.0-alpha.17` and adapted to its new i18n plugin: the editor gets `t` and `language` adapted from Volto's `intl`, and the date pill, date picker, diagram and wiki slash menu read them via `useTranslation()`. Added `@plone/icons` and `@plone/quanta`, now required by `@plone/plate`, to the workspace. Removed the unused split hotkey, `ploneBlocks` slash menu and `BlocksApiContext`. @sneridagh 
- Upgraded `@plone/plate` to Plone Aurora `1.0.0-alpha.18` and removed `@plone/quanta` from the workspace, since `@plone/plate` no longer depends on it. @sneridagh 



### Project

No significant changes.




## 1.0.0a33 (2026-10-05)

### Backend

No significant changes.




### Frontend


#### Feature

- Add a Diagram element (Plate code drawing) to the wiki editor: write Mermaid, Graphviz or Flowchart code and see the rendered diagram. PlantUML is disabled, as it sends the diagram source to plantuml.com. @sneridagh 



### Project

No significant changes.




## 1.0.0a32 (2026-10-05)

### Backend

No significant changes.




### Frontend


#### Internal

- Re-release because a stale core. @sneridagh 



### Project

No significant changes.




## 1.0.0a31 (2026-10-05)

### Backend

No significant changes.




### Frontend


#### Feature

- Keep the images of content pasted from Word, LibreOffice or a web page as image blocks. Images that come with the clipboard and images from other sites are uploaded as Image content, images of the site point at their Image content. @sneridagh 
- Pasted content from Word, LibreOffice or a web page takes the styles of the wiki page: fonts, sizes, colors, alignment, spacing and table looks are dropped, while headings, lists, tables, links, images and marks like bold or italic stay. @sneridagh 
- The title of pasted content becomes the title of the wiki page: the paragraph in the Title style of a Word or LibreOffice document, or else the first H1, from HTML or markdown. The H1s left become H2s. @sneridagh 



### Project

No significant changes.




## 1.0.0a30 (2026-10-01)

### Backend

No significant changes.




### Frontend


#### Feature

- Added Cut, Copy and Paste to the block context menu, by upgrading to `@plone/plate` 1.0.0-alpha.20 (Aurora 1.0.0-alpha.14). @sneridagh 
- Pasting an image copied from a web page (for example with "Copy image") now uploads it and inserts an image block, like pasting an image file. @sneridagh 


#### Bugfix

- Fixed dragging an image block in the editor deleting it instead of moving it, by upgrading to `@plone/plate` 1.0.0-alpha.19 (Aurora 1.0.0-alpha.13). @sneridagh 
- Fixed pasted or dropped images showing broken in the editor until the page was saved: the image block now stores the image scales returned by the upload, as Volto's image widget does. @sneridagh 
- Fixed the caret sliding into place with an animation after pressing Enter on the last paragraph in edit mode, caused by the Volto Light Theme padding transition. @sneridagh 
- Fixed the default block width not being stored for code blocks, tables, callouts, tables of contents, columns and other native blocks, which made the history diff show a width change nobody made. @sneridagh 


#### Internal

- Use VLT 8 final. @sneridagh 



### Project

No significant changes.




## 1.0.0a29 (2026-09-30)

### Backend


#### Internal:

- Update Plone 6.2.2 @sneridagh 



### Frontend


#### Breaking

- Upgraded to `@plone/plate` 1.0.0-alpha.18 (Aurora 1.0.0-alpha.12) and Plate.js 53.x. Static rendering helpers (`SlateElement`, `SlateElementProps`) are now imported from `platejs/static`. Markdown shortcuts are configured as `inputRules` on each kit, including links (markdown links and autolink on paste, space and enter). Blockquotes are now containers of blocks: legacy flat blockquotes are normalized when loaded in the editor. The `basic-blocks-kit.tsx` shadow was removed in favor of upstream's kit, so the editor no longer offers H1, which is reserved for the title. @sneridagh 


#### Feature

- Added the `# ` markdown shortcut from `@plone/plate` to the title block: it restores the title block when the document has none, like the "Title" slash menu item. @sneridagh 


#### Bugfix

- Added an accessible name to the toggle button in the public view, like the one in the editor. @sneridagh 
- Fixed editing an existing link via Browse or a search result replacing the link text; only the link target is updated now. @sneridagh 
- Fixed the caret jumping out of a restored title block when it is filled with the page title. @sneridagh 


#### Internal

- Pin Aurora to 1.0.0-alpha.10 @sneridagh 
- Removed the `turn-into-toolbar-button.tsx` shadow and the Heading 5/6 slash menu items, now that `@plone/plate` offers Heading 5 and Heading 6 in its menus. @sneridagh 


#### Tests

- Added acceptance tests for the native blocks of the wiki presets, in the editor and the public view: block interactions, slash menu, floating toolbar, block context menu and Word, HTML and markdown paste, with programmatic test page fixtures. @sneridagh 



### Project


#### Documentation

- Documented the acceptance test fixtures for the wiki presets in `AGENTS.md`. @sneridagh 



## 1.0.0a28 (2026-09-16)

### Backend

No significant changes.




### Frontend


#### Bugfix

- Fix toggle blocks in view mode @iRohitSingh [#77](https://github.com/kitconcept/volto-plate/issues/77)
- Fixed long unbroken words (e.g. a URL or a string with no spaces) overflowing the comment box instead of wrapping inside it. @iFlameing 
- Fixed the @mention popover so arrow key navigation actually highlights the selected person, instead of looking like it does nothing. @iFlameing 


#### Internal

- Added acceptance tests for selecting @mentions with a click and with arrow keys + Enter, both in the document editor and in a new comment, using two test users. @iFlameing 



### Project

No significant changes.




## 1.0.0a27 (2026-09-11)

### Backend

No significant changes.




### Frontend


#### Internal

- Use @plone/plate@1.0.0-alpha.15 @sneridagh 



### Project

No significant changes.




## 1.0.0a26 (2026-09-11)

### Backend

No significant changes.




### Frontend


#### Internal

- Add CI check enforcing the mandatory OVERRIDE documentation header on every shadowed component under `src/customizations` @sneridagh [#shadow-headers](https://github.com/kitconcept/volto-plate/issues/shadow-headers)
- Added OVERRIDE header comments (reason, upstream file link, developer, changelog) to the shadowed/customized files under `src/customizations`. @iFlameing 
- check-shadow-headers now skips asset files (.svg, images) that cannot carry a JS block comment. 



### Project


#### Internal

- Add CI check enforcing the mandatory OVERRIDE documentation header on every shadowed component under `src/customizations` @sneridagh [#shadow-headers](https://github.com/kitconcept/volto-plate/issues/shadow-headers)
- check-shadow-headers now skips asset files (.svg, images) that cannot carry a JS block comment. 



## 1.0.0a25 (2026-09-09)

### Backend

No significant changes.




### Frontend


#### Bugfix

- Fix spacing after mention and calendar date pills @iRohitSingh [#spacing](https://github.com/kitconcept/volto-plate/issues/spacing)
- Fix missing save button in users controlpanel @iRohitSingh [#54](https://github.com/kitconcept/volto-plate/issues/54)
- Fix inline comments css @iRohitSingh [#59](https://github.com/kitconcept/volto-plate/issues/59)



### Project

No significant changes.




## 1.0.0a24 (2026-08-27)

### Backend

No significant changes.




### Frontend


#### Feature

- Added a clear formatting button to the wiki page toolbar. @iFlameing 


#### Bugfix

- Avatar Fallback for personPill @iRohitSingh [#AvatarFallback](https://github.com/kitconcept/volto-plate/issues/AvatarFallback)



### Project


#### Internal

- Bump GitHub Actions versions in CI workflows (checkout/setup-node/upload-artifact to v7, cache to v6, background-action to v2). @sneridagh [#68](https://github.com/kitconcept/volto-plate/issues/68)



## 1.0.0a23 (2026-08-18)

### Backend


#### Documentation:

- Rewrote the package README and summary for publication on PyPI, replacing the generated placeholders with the actual feature set. @ericof 



### Frontend


#### Feature

- Added Accept all and Reject all buttons in the suggestions popover when there is more than one open suggestion. @iFlameing 


#### Internal

- Dropped the `artifact-release` script and the checked-in package tarball, now that the package is published to npm. @ericof 
- Switched the release hooks from `pipx` to `uvx`, vendored the changelog template instead of reading it from `node_modules`, and fixed the changelog issue link format, which pointed at the wrong repository and returned a 404 for every linked entry. @ericof 



### Project


#### Internal

- Fixed the changelog issue link format, which pointed at a non-existent `/issue/` path and returned a 404 for every linked entry, and added a `Tests` fragment type. @ericof 
- Prepared the repository for the first public release: `repoplone` now publishes both packages to PyPI and npm, and the custom pipeline that built and committed a frontend artifact was removed. @ericof 
- Removed the Read the Docs configuration, which referenced a `docs/` directory that does not exist in this repository, and the Visual Studio Code TypeScript SDK setting pointing into `node_modules`. @ericof 
- Reworked the changelog workflow to compute the package paths from the repository settings and run all three towncrier checks in a single job, and moved the Dependabot configuration to `.github/dependabot.yml`, where it is actually read. @ericof 



## 1.0.0a22 (2026-07-28)

### Backend

No significant changes.




### Frontend

#### Feature

- Added a `//` slash command in the wiki editor that opens a date picker to insert dates. @iFlameing 
- Added a `belowContentTitle` slot below the document title block so custom components can be rendered there. @iFlameing 
- Added the PersonPill component, ported from kitconcept.intranet, and used it for the @mention chip and the comments/suggestions avatars instead of first-letter initials. @iFlameing 
- Image zoom feature @Tishasoumya-02 
- Typography using shadcn/typography approach. Continue the typography implementation: heading scale, colour palette, links, lists and block flow spacing. Further iterations to follow. @sneridagh @danalvrz 

#### Bugfix

- Fix Cursor position in add/edit mode @iRohitSingh [#50](https://github.com/collective/volto-plate/issue/50)



### Project

No significant changes.




## 1.0.0a21 (2026-07-22)

### Backend


#### New features:

- Add a permission-scoped @mentions user search endpoint and email notifications for new Plate mentions. [#mentions](https://github.com/kitconcept/volto-plate/issues/mentions)


#### Internal:

- Refactored mention extraction and notification into a named `IMentions` utility, backed by shared `types` and mail-settings helpers. @ericof 


#### Tests

- Reorganized the backend test suite to mirror the package layout and added functional mail-delivery coverage through `collective.MockMailHost`. @ericof 



### Frontend

#### Feature

- Add Plone user mentions with portraits in Plate text and discussion comments. [#mentions](https://github.com/collective/volto-plate/issue/mentions)



### Project

No significant changes.




## 1.0.0a20 (2026-07-17)

### Backend

No significant changes.




### Frontend

#### Feature

- Add read-only comment and suggestion popovers to the wiki renderer, with the correct inline suggestion colours and per-mark popover targeting, and fix an editor normalization error when saving with active suggestions. [#comment-renderer-support](https://github.com/collective/volto-plate/issue/comment-renderer-support)



### Project

No significant changes.




## 1.0.0a19 (2026-07-08)

### Backend

No significant changes.




### Frontend

#### Bugfix

- Fixed login screen CSS. @sneridagh 



### Project

No significant changes.




## 1.0.0a18 (2026-07-06)

### Backend

No significant changes.




### Frontend

#### Bugfix

- Fix for tables and SemanticUI .fixed and other collisions. @sneridagh 



### Project

No significant changes.




## 1.0.0a17 (2026-07-06)

### Backend


#### Bug fixes:

- We used to restrict the types for the navigation. Now it's not needed. @sneridagh 



### Frontend

No significant changes.


### Project

No significant changes.




## 1.0.0a16 (2026-07-06)

### Backend

No significant changes.




### Frontend

#### Breaking

- Moved the navigation tree component to the distribution. @sneridagh 



### Project

No significant changes.




## 1.0.0a15 (2026-07-03)

### Backend

No significant changes.




### Frontend

#### Feature

- Add workspace switcher and workspace-scoped navigation tree to the NavigationTree panel. @iFlameing 

#### Bugfix

- Fix inherit logic. @sneridagh [#44](https://github.com/collective/volto-plate/issue/44)



### Project

No significant changes.




## 1.0.0a14 (2026-07-02)

### Backend

No significant changes.




### Frontend

#### Internal

- Missing @plone/plate updates. @sneridagh 



### Project

No significant changes.




## 1.0.0a13 (2026-07-02)

### Backend


#### Internal:

- Updated the boilerplate to use the latest `monorepo_addon` template. @ericof [#440](https://github.com/kitconcept/volto-plate/issues/440)


#### Tests

- Moved `test_upgrades.py` to `tests/setup` and switched `tests/test_comments` to use `http_request`. @ericof 



### Frontend

#### Internal

- Removed the aurora clone step when running `make clean`. @ericof 



### Project


#### Internal

- Updated `.cookieplone.json` and `repository.toml` with the `monorepo_addon` template answers. @ericof [#440](https://github.com/kitconcept/volto-plate/pull/440)
- Added the `python-envs` setting so the correct virtual environment is discovered. @ericof 
- Build and publish the backend, demo, and frontend container images as part of the staging deploy workflow. @ericof 
- Fixed demo image generation in the `.github/workflows/backend.yml` workflow. @ericof 
- Removed stray `*_cache` directories when running make clean. @ericof 



## 1.0.0a12 (2026-07-02)

### Backend


#### Internal:

- Use Python 3.14 and Plone 6.2.1 @sneridagh [#41](https://github.com/kitconcept/volto-plate/issues/41)



### Frontend

No significant changes.


### Project

No significant changes.




## 1.0.0a11 (2026-07-01)

### Backend


#### Internal:

- Downgrade the backend to use Python 3.12. @sneridagh [#40](https://github.com/kitconcept/volto-plate/issues/40)



### Frontend

No significant changes.


### Project

No significant changes.




## 1.0.0a10 (2026-07-01)

### Backend


#### Internal:

- Update to Plone 6.2.0 @sneridagh 
- Update translation. @iFlameing 



### Frontend

#### Feature

- Adapt to style fields from @plone/plate. @sneridagh 
- Add Navigation tree. @iFlameing 
- Clipboard image paste in the wiki editor now uploads through Volto's `createContent` action and inserts a `plateimage` block pointing to the created Image object, while removing the unused generic Plate media kit wiring from that editor. 
- Dragging image files from the desktop into the wiki Plate editor now uploads them through Volto's `createContent` action and inserts `plateimage` blocks, with edit and add views following the same target resolution rules as image paste. 
- Refactored wiki editor images to use dedicated `plateimage` ploneBlock rendering, schema-driven styled fields, and semantic `data-style-*` hooks instead of the old native Plate image adapter path. @sneridagh 

#### Bugfix

- Adapt to use @plone/aurora. @sneridagh [#31](https://github.com/collective/volto-plate/issue/31)
- Kept the wiki editor floating toolbar above Volto chrome by using a local portaled toolbar with Volto-aware positioning. [#33](https://github.com/collective/volto-plate/issue/33)
- Disabled the floating formatting toolbar for the title block and kept title content normalized to plain text. [#34](https://github.com/collective/volto-plate/issue/34)
- Moved the slash menu Image entry to appear directly after the paragraph option. [#35](https://github.com/collective/volto-plate/issue/35)
- Fix misalignment when we have longer titles. @iFlameing 
- Hide navigation sidebar when printing Wiki pages to remove unwanted blank space on the left. @iFlameing 
- Reverted the decision to have the images as a non-native Plate plugin.
  The Image block in this add-on is a full fledged Plate plugin piggy-backing in the original Plate Image plugin, but that exposes the Volto Image block.
  This keeps the things simple since the Wiki-editor does not use any other Volto block. @sneridagh 



### Project


#### Internal

- Update to Plone 6.2.0 @sneridagh 



## 1.0.0a9 (2026-05-28)

### Backend


#### Bug fixes:

- Adds Workspace to navigation displayed types. @iFlameing 



### Frontend

#### Bugfix

- Fix the unwanted navigation path in nested workspace. @iFlameing 



### Project

No significant changes.




## 1.0.0a8 (2026-05-14)

### Backend

No significant changes.




### Frontend

No significant changes.


### Project

No significant changes.




## 1.0.0a7 (2026-05-13)

### Backend


#### New features:

- Add workspace marker behavior to the Workspace content type to discover the nearest Workspace ancestor. @iFlameing 



### Frontend

#### Bugfix

- - Fixed an issue where the first-level navigation was not shown for the active page.
  - Added persistence for navigation open/close preferences using localStorage.
  - Use the nearest Workspace ancestor as the navigation root to display the complete navigation tree. @iFlameing 
- Fix CSS for containers. @sneridagh 

#### Internal

- Playwright test for bold, italics and striketrough toolbar options. @iFlameing 



### Project

No significant changes.




## 1.0.0a6 (2026-05-11)

### Backend

No significant changes.




### Frontend

#### Bugfix

- Removed CSS container hack. @sneridagh 



### Project

No significant changes.




## 1.0.0a5 (2026-05-08)

### Backend


#### New features:

- Rename Wiki -> Workspace. @sneridagh [#18](https://github.com/kitconcept/volto-plate/issues/18)
- Add a folderish `Wiki` content type, constrain `WikiPage` placement, and move the example wiki page under `/wiki`. @sneridagh 
- Add backend support for storing Plate block comments. @davisagli 
- Added preview_image_link and other missing behaviors to WikiPage. @sneridagh 
- Improve and complete demo content. @sneridagh 


#### Internal:

- Update example content. @ericof [#example](https://github.com/kitconcept/volto-plate/issues/example)
- Create a demo image with example content. @ericof 
- Update to Plone 6.2.0rc1 and plone.restapi 10.0.0rc3. @davisagli 



### Frontend

#### Feature

- Add Navigation Portlet beside toolbar. @iFlameing 

#### Internal

- During release, generate a tarball containing the package and its dependencies.@ericof 



### Project


#### Feature

- Add a folderish `Wiki` content type, constrain `WikiPage` placement, and move the example wiki page under `/wiki`. Fixed tests. @sneridagh 


#### Internal

- Add GitHub Actions workflows to deploy demo sites to kitconcept's cluster. @ericof 
- Add `devops/stacks/persistent.yml` and `devops/stacks/demo.yml`. @ericof 
- Enable searching the core folder in the file search command. @iFlameing 
- Implement a custom pipeline to be run by repoplone, supporting the creation of the frontend package artifact (This requires repoplone >= 1.0.0b11). @ericof
   - Run `uvx repoplone settings release-steps` to check the existence of a new step named `frontend_artifact` 
- Main workflow: use IMAGE_BACKEND/IMAGE_FRONTEND vars and stop forwarding DB credentials. @ericof 
- Remove old references to collective-addon. @ericof 
- Update cookieplone-generated boilerplate. @ericof 


#### Documentation

- Fix typos in the README file for the repository. @ericof 



