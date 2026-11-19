---
block: plateimage
---

Shows an image in a page that stores a Plate document, with optional alt text, link, alignment and size.

It's not offered in the block chooser of other pages: it's the image of a Plate document, as a `ploneBlock` node.

Set `url` to the path of an Image content item of the site, for example `/my-folder/my-image`, without `/@@images/image`: the backend adds its `image_scales`, and the view picks the right scale from them. For an external image, set `url` to its full URL. Leave `image_field` and `image_scales` out.

### Fields

- `url`: the URL of the image.
- `alt`: alternative text for screen readers.
- `href`: optional link target.
- `openLinkInNewTab`: whether the link opens in a new tab.
- `align`: `center`, `left` or `right`.
- `size`: `l`, `m` or `s`.

### Example

```json
{
  "type": "ploneBlock",
  "@type": "plateimage",
  "url": "/images/team-photo",
  "alt": "The team at the 2025 conference",
  "align": "center",
  "size": "l",
  "children": [{ "text": "" }]
}
```
