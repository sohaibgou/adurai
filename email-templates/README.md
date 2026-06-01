# Adur.ai — Branded email verification templates

Two ready-to-paste, brand-matched HTML email templates for Supabase auth, plus
the exact steps to install them.

| File | Supabase template | Link type |
|------|-------------------|-----------|
| `verify-email.html` | **Magic Link** | `&type=magiclink` |
| `verify-email-signup.html` | **Confirm signup** | `&type=signup` |

> **Why two files?** This app's primary verification path sends through Supabase's
> **Magic Link** template (server calls `/auth/v1/otp` from the signup route and the
> resend-verify route). The login page's "resend" uses `auth.resend({ type: "signup" })`,
> which goes through the **Confirm signup** template. Installing both keeps every path
> on-brand.

---

## Why the token-hash link (and not the default `?code=`)

The button and fallback link both point to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink   (or &type=signup)
```

This is the **token-hash** flow. It works even when the user opens the email on a
**different device** than they signed up on. The default Supabase `{{ .ConfirmationURL }}`
uses a PKCE `?code=` link that needs the `code_verifier` stored in the original
browser — so it **fails cross-device**. Do not swap the button back to
`{{ .ConfirmationURL }}`.

---

## Install steps

### 1. URL configuration (do this first)

Supabase Dashboard → **Authentication** → **URL Configuration**

- **Site URL**: set to the production app URL, e.g. `https://adur.ai`
  (this is what `{{ .SiteURL }}` resolves to in the templates).
- **Redirect URLs**: add `https://adur.ai/auth/confirm`
  (and `http://localhost:3000/auth/confirm` if you test locally).

### 2. Magic Link template

Supabase Dashboard → **Authentication** → **Email Templates** → **Magic Link**

- **Subject**: `Verify your email — Adur.ai`
- **Message body**: open `verify-email.html`, copy the entire file, paste it into
  the body editor (switch the editor to source/HTML mode first).
- Save.

### 3. Confirm signup template

Supabase Dashboard → **Authentication** → **Email Templates** → **Confirm signup**

- **Subject**: `Verify your email — Adur.ai`
- **Message body**: paste the entire contents of `verify-email-signup.html`.
- Save.

### 4. Send yourself a test

Sign up with a real address (or use the resend button on the verify gate) and
confirm: the email renders with the gradient badge + pink CTA, the button lands on
`/auth/confirm`, and verification completes. Test once on a **second device** to
confirm the cross-device path.

---

## Editing notes

- Tables + inline styles only. **Do not** "prettify" into `<div>`/flexbox — that
  breaks Outlook and several mobile clients.
- The CTA has an Outlook/VML fallback (`<!--[if mso]>` block). If you change the
  button label or URL, update it in **all three** places: the VML `<v:roundrect>`,
  the `<a>` tag, and the plain fallback link near the bottom.
- Brand colors: gradient `linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)`,
  background `#FAF8F5`, card `#ffffff`, ink `#0D0D12`.
- Available Supabase variables: `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Email }}`,
  `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .RedirectTo }}`.
- Tested for Gmail, Apple Mail, Outlook (solid-color button fallback), and mobile.
