---
block: plateimage
---

Shows an image in a page that stores a Plate document, with optional alt text, link, alignment and size.

It's not offered in the block chooser of other pages: it's the image of a Plate document, as a `ploneBlock` node.

Set `url` to the image itself: for an Image content item of the site, its path followed by `/@@images/image` (for example `/my-folder/my-image/@@images/image`), or the full URL of an external image. The editor adds `image_field` and `image_scales` when it uploads an image itself. Leave them out.

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
  "url": "/images/team-photo/@@images/image",
  "alt": "The team at the 2025 conference",
  "align": "center",
  "size": "l",
  "children": [{ "text": "" }]
}
```
