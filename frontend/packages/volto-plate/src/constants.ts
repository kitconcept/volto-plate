/**
 * The key, in the `blocks` field of the content, of the region that holds the
 * page body. Regions are not listed in `blocks_layout`.
 */
export const MAIN_REGION = 'main';

/**
 * The `@type` of a region whose `value` is a Plate document.
 */
export const PLATE_TYPE = 'plate';

/**
 * The key and `@type` of the Plate document in content stored before the page
 * body became the `main` region. It is still read, and the editor renames it
 * to `main` on the first save, see https://github.com/plone/aurora/issues/379.
 *
 * @deprecated Use `MAIN_REGION` for the key and `PLATE_TYPE` for the `@type`.
 */
export const SOMERSAULT_KEY = '__somersault__';
