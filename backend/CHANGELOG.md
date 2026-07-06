# Changelog

<!--
   You should *NOT* be adding new change log entries to this file.
   You should create a file in the news directory instead.
   For helpful instructions, please see:
   https://github.com/plone/plone.releaser/blob/master/ADD-A-NEWS-ITEM.rst
-->

<!-- towncrier release notes start -->

## 1.0.0a16 (2026-07-06)

No significant changes.


## 1.0.0a15 (2026-07-03)

No significant changes.


## 1.0.0a14 (2026-07-02)

No significant changes.


## 1.0.0a13 (2026-07-02)


### Internal:

- Updated the boilerplate to use the latest `monorepo_addon` template. @ericof [#440](https://github.com/kitconcept/volto-plate/issues/440)


### Tests

- Moved `test_upgrades.py` to `tests/setup` and switched `tests/test_comments` to use `http_request`. @ericof 

## 1.0.0a12 (2026-07-02)


### Internal:

- Use Python 3.14 and Plone 6.2.1 @sneridagh [#41](https://github.com/kitconcept/volto-plate/issues/41)

## 1.0.0a11 (2026-07-01)


### Internal:

- Downgrade the backend to use Python 3.12. @sneridagh [#40](https://github.com/kitconcept/volto-plate/issues/40)

## 1.0.0a10 (2026-07-01)


### Internal:

- Update to Plone 6.2.0 @sneridagh 
- Update translation. @iFlameing 

## 1.0.0a9 (2026-05-28)


### Bug fixes:

- Adds Workspace to navigation displayed types. @iFlameing

## 1.0.0a8 (2026-05-14)

No significant changes.


## 1.0.0a7 (2026-05-13)


### New features:

- Add workspace marker behavior to the Workspace content type to discover the nearest Workspace ancestor. @iFlameing

## 1.0.0a6 (2026-05-11)

No significant changes.


## 1.0.0a5 (2026-05-08)


### New features:

- Rename Wiki -> Workspace. @sneridagh [#18](https://github.com/kitconcept/volto-plate/issues/18)
- Add a folderish `Wiki` content type, constrain `WikiPage` placement, and move the example wiki page under `/wiki`. @sneridagh
- Add backend support for storing Plate block comments. @davisagli
- Added preview_image_link and other missing behaviors to WikiPage. @sneridagh
- Improve and complete demo content. @sneridagh


### Internal:

- Update example content. @ericof [#example](https://github.com/kitconcept/volto-plate/issues/example)
- Create a demo image with example content. @ericof
- Update to Plone 6.2.0rc1 and plone.restapi 10.0.0rc3. @davisagli
