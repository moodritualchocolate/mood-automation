# Codex Handoff — Upload MOOD to Shopify (Draft, no publish)

**Paste this ENTIRE file to Codex/ChatGPT as the first message. Then attach `mood-shopify.zip`.**

---

## Task

Upload the MOOD Ritual Chocolate site to a Shopify store as a **Draft/Preview** theme + all products, pages, blog, navigation, and media. **DO NOT publish.** **DO NOT touch the domain.** Everything must stay on `.myshopify.com` and appear as an unpublished theme + draft content until the user explicitly clicks Publish themselves.

## What you have

Attached ZIP contains:
- `theme/` — full OS 2.0 Liquid theme (layout, sections, templates, snippets, config, locales, assets/theme.css, assets/theme.js)
- `products/products.csv` — 4 products × 3 variants each = 10 rows
- `pages/*.html` — HTML for club, blog articles, policies
- `assets-media/` — hero videos + product images + posters
- `README.md` — human-readable spec

## Ask the user for (BEFORE starting)

1. **Shopify store URL** — format: `xxx.myshopify.com`
2. **Admin API access token** — format: `shpat_...`
   - If they don't have one yet, walk them through: `Settings → Apps and sales channels → Develop apps → Create an app "mood-uploader" → Configure Admin API scopes → check: write_products, read_products, write_themes, read_themes, write_files, read_files, write_content, read_content, write_online_store_navigation, read_online_store_navigation, write_online_store_pages, read_online_store_pages → Save → Install app → copy the shpat_ token (shown ONCE)`

## Execution plan — do these steps in this order

### 1. Environment setup

```bash
python3 -m pip install --user requests
export SHOP="xxx.myshopify.com"          # from user
export TOKEN="shpat_..."                 # from user
export API="https://$SHOP/admin/api/2024-10"
```

Verify auth works:
```bash
curl -sS -H "X-Shopify-Access-Token: $TOKEN" "$API/shop.json" | head -c 500
```
Expect JSON with the shop name. If 401 — token wrong. If 403 — scopes wrong.

### 2. Upload media files (`assets-media/`)

For each file in `assets-media/`, POST to Files:
```bash
# Use the fileCreate GraphQL mutation
curl -sS -X POST "https://$SHOP/admin/api/2024-10/graphql.json" \
  -H "X-Shopify-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation fileCreate($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id preview { image { url } } } userErrors { field message } } }","variables":{"files":[{"originalSource":"<PUBLIC_URL_OR_STAGED_UPLOAD_URL>","alt":"...","contentType":"VIDEO"}]}}'
```

For MP4/JPG in a local ZIP, use the two-step staged upload:
1. `stagedUploadsCreate` → get target URL
2. multipart POST the binary to that URL
3. `fileCreate` with the returned `resourceUrl`

Track each file's final `shopify://files/<name>` URL — you'll need them for theme templates.

### 3. Import products (`products/products.csv`)

Simplest path — use the Shopify Admin UI (user's browser):
- Tell the user: "Open Shopify Admin → Products → Import → upload `products.csv` from the ZIP. Wait for the email confirmation. Then come back and tell me it's done."

If you have full API access and want to automate: parse the CSV row-by-row and POST to `/admin/api/2024-10/products.json` with the correct variant + image structure. **Warning:** the CSV format ≠ REST API format — you must group rows by Handle and build one nested product object per handle.

### 4. Upload theme as UNPUBLISHED

```bash
# Zip only the theme/ subdirectory (NOT the whole package)
cd shopify-package && zip -r theme-only.zip theme/

# Then create theme via REST
curl -sS -X POST "$API/themes.json" \
  -H "X-Shopify-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme":{"name":"MOOD Ritual (Draft)","src":"<HOSTED_ZIP_URL>","role":"unpublished"}}'
```

**Important:** `src` must be a publicly reachable HTTPS URL. Options:
- (A) Upload the zip to Shopify Files first, use the resulting CDN URL
- (B) Upload to a GitHub Gist / S3 / tmpfiles.org and pass that URL
- (C) Use Shopify CLI instead: `shopify theme push --unpublished --store $SHOP` (requires `shopify` CLI installed + OAuth login)

After creation, note the returned `theme.id`. Confirm the role is `unpublished`.

### 5. Create Pages

For each of `pages/club.html`, `pages/blog.html`, `pages/policies.html`:
```bash
BODY=$(cat pages/club.html | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")
curl -sS -X POST "$API/pages.json" \
  -H "X-Shopify-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"page\":{\"title\":\"מועדון לקוחות\",\"body_html\":$BODY,\"published\":false}}"
```

Page titles + handles:
- `pages/club.html` → title: `מועדון לקוחות`, handle: `club`
- `pages/policies.html` → title: `מדיניות`, handle: `policies`
- Skip `pages/blog.html` at this step — it's a bundle of articles for the Blog, not one page.

### 6. Create Blog + first article

```bash
# Create blog "news"
curl -sS -X POST "$API/blogs.json" \
  -H "X-Shopify-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blog":{"title":"בלוג","handle":"news"}}'

# Get BLOG_ID from response, then create one placeholder article:
curl -sS -X POST "$API/blogs/$BLOG_ID/articles.json" \
  -H "X-Shopify-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"article":{"title":"ברוכים הבאים לבלוג mood","body_html":"<p>מחשבות, ריטואלים, ושיחות מהצוות שמאחורי mood.</p>","published":false}}'
```

### 7. Build Navigation

Shopify does NOT expose menus via REST — must use the online_store_navigation GraphQL:

```graphql
mutation menuCreate($handle: String!, $title: String!, $items: [MenuItemCreateInput!]!) {
  menuCreate(handle: $handle, title: $title, items: $items) {
    menu { id handle title }
    userErrors { field message }
  }
}
```

Menu handle: `main-menu`. Items:
1. `מוצרים` → `/collections/all`
2. `היום המלא` → `/products/mood-full-day`
3. `הסיפור` → `/pages/about` (create empty page or skip)
4. `מועדון לקוחות` → `/pages/club`
5. `בלוג` → `/blogs/news`

If GraphQL scope is missing: tell the user to do this step manually in Admin → Online Store → Navigation → Add menu items.

### 8. Verify + report

Run these checks and print a summary:
```bash
# Products count
curl -sS -H "X-Shopify-Access-Token: $TOKEN" "$API/products/count.json"
# Themes list (expect 2+: current live theme + new "MOOD Ritual (Draft)")
curl -sS -H "X-Shopify-Access-Token: $TOKEN" "$API/themes.json" | python3 -m json.tool
# Pages
curl -sS -H "X-Shopify-Access-Token: $TOKEN" "$API/pages.json" | python3 -m json.tool
# Files count
curl -sS -X POST "https://$SHOP/admin/api/2024-10/graphql.json" \
  -H "X-Shopify-Access-Token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"{ files(first: 50) { edges { node { id alt } } } }"}'
```

### 9. Preview link for the user

The Draft theme has a preview URL. Fetch it:
```bash
curl -sS -H "X-Shopify-Access-Token: $TOKEN" "$API/themes/$THEME_ID.json"
```
Preview URL is: `https://$SHOP/?preview_theme_id=$THEME_ID`

Give the user this link so they can view the site before publishing.

## Guardrails — DO NOT

- ❌ Do NOT set `role: main` on the theme (would publish it).
- ❌ Do NOT change any existing published theme.
- ❌ Do NOT modify DNS / custom domain / Shop settings.
- ❌ Do NOT install any apps.
- ❌ Do NOT set up payment providers.
- ❌ Do NOT enable/disable checkout.
- ❌ Do NOT delete anything the user already has.

## Success criteria

Report to user in Hebrew when done:
```
✓ הועלו X קבצי מדיה
✓ נוצרו 4 מוצרים עם 10 וריאנטים
✓ הועלה theme חדש "MOOD Ritual (Draft)" — לא פורסם
✓ נוצרו 2 דפים (מועדון לקוחות, מדיניות)
✓ נוצר בלוג "news"
✓ נבנה תפריט main-menu
✓ קישור Preview: https://xxx.myshopify.com/?preview_theme_id=YYYY

השלבים שעדיין דורשים אותך:
- לפרסם את ה-theme (Themes → MOOD Ritual (Draft) → Actions → Publish)
- לחבר Payment provider (Cardcom / Tranzila / Meshulam)
- לחבר את הדומיין (Settings → Domains)
```

## If anything fails

Stop, report exactly which step failed, what error Shopify returned, and ask the user how to proceed. Do NOT skip failed steps silently. Do NOT continue past a failure.

---

**End of handoff. Ask the user for the token + store URL now.**
