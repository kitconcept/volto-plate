Yes. From [`frontend/core/packages/volto/build/public/stats.json`](/Users/sneridagh/Development/kitconcept/volto-plate/frontend/core/packages/volto/build/public/stats.json), there are clear wins.

Biggest findings:

1. Initial bundle is very large: `static/js/client.07a2158a.js` is ~6.78 MB, `static/css/client.2c90f3ac.css` is ~1.17 MB.
2. Read-only text rendering is pulling heavy editor/parsing features into the main chunk via [`TextBlockView.tsx:3`](/Users/sneridagh/Development/kitconcept/volto-plate/frontend/packages/volto-plate/src/components/blocks/Text/TextBlockView.tsx:3) and [`block-editor-base-kit.tsx:12`](/Users/sneridagh/Development/kitconcept/volto-plate/frontend/seven/packages/plate/components/editor/block-editor-base-kit.tsx:12), including:
- `@platejs/markdown` -> `acorn` (~471 KB combined)
- `@platejs/docx`/`@platejs/juice` -> `parse5`/`cheerio` (~377 KB)
- `lowlight(all)` -> huge `highlight.js` language payload (~1.56 MB total in chunk)
3. AI mock code is shipping to production path: [`use-chat.ts:4`](/Users/sneridagh/Development/kitconcept/volto-plate/frontend/seven/packages/plate/components/editor/use-chat.ts:4) imports `@faker-js/faker`, and file comments say “remove when you implement route”. This alone drags in ~487 KB parsed size plus `ai`/`zod`.
4. CSS is heavy mainly from Semantic UI and theme layers (`semantic.less` ~1.4 MB parsed css module + theme SCSS/extras).
5. Duplicate dependencies exist in bundle (e.g. `tailwind-merge@3.0.2` and `3.3.1` both present, ~179 KB total), so dedupe/overrides can shave some bytes.

Highest-impact improvements to do first:

1. Split renderer vs editor plugin sets so view mode does not include markdown/docx/AI/code-syntax stacks.
2. Remove or dev-gate faker-based mock streaming in [`use-chat.ts`](/Users/sneridagh/Development/kitconcept/volto-plate/frontend/seven/packages/plate/components/editor/use-chat.ts:1).
3. Replace `createLowlight(all)` with a small explicit language list in [`code-block-base-kit.tsx:6`](/Users/sneridagh/Development/kitconcept/volto-plate/frontend/seven/packages/plate/components/editor/plugins/code-block-base-kit.tsx:6).
4. Audit Semantic UI imports/theme overrides to reduce base CSS.
5. Run `pnpm dedupe` + targeted `overrides` for duplicated libs (especially `tailwind-merge`).
