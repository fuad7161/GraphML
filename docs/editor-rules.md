# Smart Node Editor — Rules & Changes

This document describes the intelligent editing constraints and UI improvements
added to the **Edit Node** modal (double-click or right-click → Edit).

---

## 1. Tag Name — Dropdown instead of free text

The tag name field is now a **grouped `<select>` dropdown** containing all
standard HTML tags organised by category:

| Group | Tags |
|---|---|
| **Document** | `html`, `head`, `body`, `title`, `meta`, `link`, `base`, `style`, `script`, `noscript`, `template` |
| **Sections** | `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `address` |
| **Headings** | `h1` – `h6` |
| **Text Block** | `p`, `blockquote`, `pre`, `div`, `hr`, `br`, `figure`, `figcaption`, `details`, `summary`, `dialog` |
| **Inline Text** | `a`, `abbr`, `b`, `em`, `strong`, `span`, `code`, `mark`, `small`, `sub`, `sup`, `time`, `var`, … |
| **Lists** | `ul`, `ol`, `li`, `dl`, `dt`, `dd`, `menu` |
| **Table** | `table`, `caption`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `col`, `colgroup` |
| **Forms** | `form`, `input`, `button`, `select`, `option`, `textarea`, `label`, `fieldset`, `legend`, … |
| **Media** | `img`, `audio`, `video`, `source`, `track`, `picture`, `embed`, `iframe`, `canvas`, … |
| **Semantic** | `main`, `search`, `hgroup` |

If the current node uses a tag not in the list (e.g. a custom element), it
appears at the top labelled `(custom)`.

---

## 2. Text Content Field — Conditionally shown

The **Text Content** field is now **hidden automatically** for tags that
should never contain direct text:

### Tags that hide the text field (container-only / void)

Void / self-closing elements:
`area`, `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `link`, `meta`,
`param`, `source`, `track`, `wbr`

Container-only elements (no direct text content makes sense):
`html`, `head`, `body`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `colgroup`,
`dl`, `fieldset`, `form`, `map`, `noscript`, `object`, `ol`, `optgroup`,
`picture`, `select`, `ul`, `video`, `audio`, `datalist`, `details`, `dialog`,
`figure`, `frameset`, `menu`, `nav`, `section`, `template`

### Tags that show the text field

All text-level and phrasing-content elements:
`p`, `h1`–`h6`, `span`, `a`, `em`, `strong`, `li`, `td`, `th`, `button`,
`label`, `option`, `title`, `div`, `blockquote`, `pre`, `code`, …

When you **change the tag** in the dropdown, the text field appears or
disappears in real time.

---

## 3. Attribute Key — Dropdown per tag

The attribute **key** input is now a `<select>` dropdown populated with:

1. **Global HTML attributes** (valid on every element):
   `id`, `class`, `style`, `title`, `lang`, `dir`, `tabindex`, `hidden`,
   `accesskey`, `contenteditable`, `draggable`, `spellcheck`, `translate`,
   `data-*`, `role`, `aria-label`, `aria-hidden`, `aria-describedby`

2. **Tag-specific attributes** — merged automatically when the tag changes:

| Tag | Extra attributes |
|---|---|
| `<a>` | `href`, `target`, `rel`, `download`, `hreflang`, `type`, `referrerpolicy` |
| `<img>` | `src`, `alt`, `width`, `height`, `loading`, `decoding`, `srcset`, `sizes`, `crossorigin`, `usemap`, `ismap` |
| `<input>` | `type`, `name`, `value`, `placeholder`, `required`, `disabled`, `readonly`, `checked`, `min`, `max`, `step`, `pattern`, `maxlength`, `minlength`, `autocomplete`, `autofocus`, `form`, `list`, `multiple`, `size`, `accept` |
| `<meta>` | `name`, `content`, `charset`, `http-equiv`, `property` |
| `<link>` | `href`, `rel`, `type`, `media`, `sizes`, `crossorigin`, `integrity` |
| `<video>` | `src`, `controls`, `autoplay`, `loop`, `muted`, `poster`, `preload`, `width`, `height`, `playsinline` |
| …and 30+ more tags | see `TAG_ATTRS` in `js/editor.js` |

If a node already has an attribute not in the allowed list (e.g. a custom
`data-xyz`), it is preserved and shown as `data-xyz (custom)` in the dropdown.

When you **change the tag**, all existing attribute rows are rebuilt with the
new tag's dropdown options. Existing key–value pairs are preserved if the key
is still valid.

---

## 4. Attribute Value — Free text, space-separated

The attribute **value** remains a free-text input.

- For attributes that accept **multiple values** (e.g. `class`), simply
  type them **space-separated**: `heading primary bold`.
- If two rows use the **same key**, their values are **merged with a space**
  on save (so you'll never lose data).

---

## 5. Files Changed

| File | Change |
|---|---|
| `js/editor.js` | Full rewrite — tag knowledge base, conditional text field, attribute dropdowns, smart save |
| `index.html` | Modal: `<input>` → `<select>` for tag, added `id="edit-info-field"` wrapper, `onchange` handler |
| `css/modal.css` | New styles for `<select>` dropdowns, custom arrow, optgroup styling, flex fixes |
