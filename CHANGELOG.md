# Change log

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->
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



