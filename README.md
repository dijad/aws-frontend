# Global Notes — Frontend

Nuxt 3 (Vue 3 + TypeScript) SSR app. Talks to the NestJS backend over REST + Socket.IO.

## Stack

- Nuxt 3 + Vue 3 + TypeScript
- Tailwind CSS (`@nuxtjs/tailwindcss`) + custom component classes (`btn-*`, `card`, `input`)
- Pinia stores (`auth`, `notifications`, `modules`)
- `nuxt-tiptap-editor` for rich text — used for note editor (with `@tiptap/extension-mention`) and for the user manual
- `socket.io-client` for realtime notifications
- `@nuxtjs/i18n` (default locale `es`, fallback `en`)

## Setup

```bash
cp .env.example .env
npm install
npm run dev                # http://localhost:3000
```

Default seeded admin (created by the backend `seed` script):
`admin@example.com` / `Admin123!`.

## GCP (Cloud Run)

`Dockerfile` + `cloudbuild.yaml` en este repo. Guía completa en el backend: [docs/gcp-deploy.md](https://github.com/dijad/aws-backend/blob/main/docs/gcp-deploy.md).

Build args requeridos: `NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_WS_BASE` (URL del API desplegado).

## Layout

```
frontend/
├── nuxt.config.ts
├── app.vue
├── assets/css/main.css
├── layouts/
│   ├── default.vue          # sidebar + header (with notification bell)
│   └── auth.vue             # full-bleed centered (login)
├── middleware/
│   ├── auth.global.ts       # gates everything except /login
│   └── permission.ts        # used by pages with definePageMeta({ permissions: [...] })
├── pages/
│   ├── login.vue
│   ├── index.vue            # → /global-notes
│   ├── global-notes/
│   │   ├── index.vue                     # mis notas
│   │   ├── new.vue                       # editor TipTap + menciones + destinatarios
│   │   ├── [id].vue                      # detalle (read-only) + sub-notas + acciones de admin
│   │   ├── approvals.vue                 # bandeja de notas (admin)
│   │   ├── system-updates/
│   │   │   ├── index.vue                 # listado + form lateral New Request
│   │   │   ├── [id].vue                  # detalle con acciones de Dev/Admin
│   │   │   └── inbox.vue                 # bandeja de revisión
│   │   └── manual/
│   │       ├── index.vue                 # grid de categorías + búsqueda
│   │       ├── [moduleSlug]/index.vue    # docs + changelog
│   │       ├── [moduleSlug]/[docSlug].vue
│   │       └── [moduleSlug]/[docSlug]/edit.vue
│   ├── admin/
│   │   ├── users/{index,new,[id]}.vue
│   │   ├── roles/index.vue               # matriz de permisos
│   │   └── modules/index.vue
│   └── notifications/index.vue
├── components/
│   ├── notes/ (NoteCard, NoteEditor, NoteContentViewer, NoteStatusBadge, MentionList, mentionSuggestion)
│   ├── system-updates/ (RequestCard, StatusBadge, PriorityBadge)
│   ├── manual/ (RichEditor)
│   └── NotificationBell.vue
├── composables/ (useApi, usePermissions)
├── plugins/ (auth-init.client, socket.client)
├── stores/ (auth, notifications, modules)
└── i18n/locales/ (es.json, en.json)   # @nuxtjs/i18n v10 default location
```

## Authentication

`stores/auth.ts` keeps `accessToken` + `refreshToken` in memory and mirrors them to `localStorage`. `composables/useApi.ts` automatically injects the Bearer token, retries with a refreshed token on 401, and falls back to logging out only if refreshing fails.

The realtime socket plugin (`plugins/socket.client.ts`) re-connects whenever the access token changes.

## RBAC in the UI

Use the `usePermissions()` composable (`can`, `canAny`) to hide/show actions:

```vue
<script setup>
const { can } = usePermissions();
</script>
<template>
  <button v-if="can('NOTE_APPROVE_REJECT')" class="btn-primary">Aprobar</button>
</template>
```

Or guard whole pages:

```ts
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['ROLE_MANAGE'],
});
```

The middleware aborts navigation with a 403 if the user lacks the permissions.

## i18n

The UI ships with Spanish strings (matching the screenshots) and English fallback. Add new strings to both `i18n/locales/es.json` and `i18n/locales/en.json`. Special characters like `@` must be escaped as `{'@'}` because vue-i18n parses them as linked-message syntax otherwise.
