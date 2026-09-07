# Change log

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->
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



