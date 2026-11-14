# EMPOWER FAQ Website — Implementation Plan

## 1. Project Overview

Build a website that closely replicates the existing EMPOWER FAQ website:

- Reference: https://empower-faqs.vercel.app
- Frontend build tool: Vite
- Frontend framework: React
- Language: TypeScript
- Styling: Tailwind CSS
- Admin authentication: Supabase Auth
- Backend: Vercel Serverless Functions
- Persistent content storage: Vercel Blob using a JSON document
- Hosting: Vercel
- Video platform: YouTube

The public website should preserve the reference website's layout, visual style, content hierarchy, and interaction patterns as closely as practical. Add a separate, protected admin area for managing FAQ and video cards.

## 2. Goals

1. Replicate the reference website before introducing new visual patterns.
2. Keep the public experience responsive across desktop, tablet, and mobile.
3. Allow authorized administrators to create, edit, delete, reorder, draft, and publish content.
4. Allow administrators to add video cards using YouTube URLs.
5. Generate YouTube thumbnail URLs automatically from valid video URLs.
6. Store content persistently as JSON in Vercel Blob.
7. Display published content on the public website from the stored JSON data.
8. Keep privileged credentials and content-management operations on the server.

## 3. Reference Website Inspection

Before implementation, inspect the live reference website in a browser.

Document and reproduce the following where present:

- Page structure and section order
- Header, navigation, and footer
- Typography, font weights, and text hierarchy
- Colors, backgrounds, borders, shadows, and spacing
- Card dimensions, alignment, and responsive behavior
- FAQ categories and expandable/collapsible behavior
- Video card layout and thumbnail treatment
- Buttons, links, hover states, and transitions
- Mobile navigation and small-screen layouts
- Loading, empty, and other visible states

Capture screenshots at representative desktop and mobile viewport sizes. Use these as visual references during implementation.

Do not assume the page structure from its URL or replace the existing design with a generic FAQ template. If an interaction or visual detail cannot be determined, inspect the live site further before making a decision.

## 4. Recommended Technology Stack

| Area | Technology | Responsibility |
|---|---|---|
| Build tool | Vite | Development server and production build |
| UI | React | Page and component rendering |
| Language | TypeScript | Type-safe application code |
| Styling | Tailwind CSS | Responsive styling |
| UI primitives | shadcn/ui, only where useful | Accessible dialogs, forms, and controls |
| Icons | Lucide React | Interface icons |
| Routing | React Router | Public and admin routes |
| Authentication | Supabase Auth | Admin sign-in and session management |
| Server API | Vercel Functions | Protected content operations |
| Persistent storage | Vercel Blob | Store and retrieve the JSON content document |
| Hosting | Vercel | Deploy the frontend and API functions |

Keep dependencies limited to what the application actually needs. Do not add a separate database unless the JSON storage approach becomes unsuitable.

## 5. Application Architecture

Use a clear separation between the public frontend, admin frontend, and server-side API.

### Public frontend

- Load published content from the public content API.
- Render FAQ categories and cards using reusable components.
- Render video cards using their saved YouTube thumbnail and URL.
- Handle loading, empty, and request-error states.
- Never expose draft or unpublished content.

### Admin frontend

- Require an authenticated administrator session.
- Provide a dashboard for managing FAQ and video content.
- Use forms with validation and clear save/publish feedback.
- Confirm destructive actions such as deletion.
- Refresh the displayed content after successful changes.

### Server-side API

- Verify the administrator's Supabase access token on every protected request.
- Validate request bodies and content fields.
- Read and write the JSON document in Vercel Blob.
- Keep the Blob token and Supabase server credentials in server-only environment variables.
- Return appropriate HTTP status codes and safe error messages.
- Never trust a client-side admin flag as authorization.

## 6. Content Model

Use a versioned JSON document so its structure can evolve safely.

Example:

```json
{
  "version": 1,
  "categories": [
    {
      "id": "category-001",
      "title": "Getting Started",
      "description": "",
      "order": 1,
      "cards": [
        {
          "id": "video-001",
          "type": "video",
          "title": "Introduction to EMPOWER",
          "description": "Learn the basics of EMPOWER.",
          "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
          "youtubeVideoId": "VIDEO_ID",
          "thumbnailUrl": "https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg",
          "status": "published",
          "order": 1,
          "createdAt": "2026-11-14T00:00:00.000Z",
          "updatedAt": "2026-11-14T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

The example is illustrative. Confirm the final content types and fields after inspecting the reference website.

### Data rules

- Use stable unique IDs for categories and cards.
- Use an explicit content type, such as `faq` or `video`, if both types share the same card collection.
- Use `draft` and `published` as the initial publication states.
- Keep ordering explicit with numeric `order` fields.
- Store timestamps in ISO 8601 format.
- Validate the JSON document before saving it.
- Do not store derived values when they can be safely generated, unless storing them improves reliability or avoids repeated work.

## 7. YouTube URL and Thumbnail Handling

The admin form must accept supported YouTube URL formats, including:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

Extract and validate the video ID. Reject unsupported or malformed URLs with a clear validation message.

Generate the thumbnail URL from the validated video ID:

```text
https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
```

The admin should see a thumbnail preview before saving.

On the public website:

- Display the saved thumbnail.
- Make the card open or play the corresponding YouTube video.
- Prefer an accessible embedded-player dialog or the interaction pattern used by the reference website.
- Provide a fallback if the thumbnail cannot load.
- Do not assume every video has every YouTube thumbnail resolution available.

## 8. Admin CMS Requirements

Create a protected admin area separate from the public website.

### Authentication

- Provide an admin login page.
- Use Supabase Auth for sign-in and session handling.
- Restrict admin routes to authenticated users.
- Verify the user's identity and admin authorization on the server for every write operation.
- Do not provide public admin registration unless explicitly required.
- Sign out securely and handle expired sessions.

### Dashboard

Show a useful overview, such as:

- Total cards
- Published cards
- Draft cards
- Total categories

Only include metrics that can be derived reliably from the stored content.

### Content management

Administrators must be able to:

- Create a category.
- Edit a category.
- Delete a category, with confirmation and a clear explanation of what happens to its cards.
- Create FAQ cards.
- Create video cards.
- Edit existing cards.
- Delete cards, with confirmation.
- Save cards as drafts.
- Publish and unpublish cards.
- Reorder categories and cards.
- Preview content before publishing.

### Video card fields

- Title
- Description
- YouTube URL
- Automatically generated YouTube video ID
- Automatically generated thumbnail preview
- Category
- Display order
- Publication status

### FAQ card fields

Inspect the reference website to determine the appropriate FAQ fields and presentation. At minimum, support a question/title and answer if the reference uses question-and-answer content.

### CMS behavior

- Validate required fields before submission.
- Prevent accidental duplicate submissions.
- Show loading and saving states.
- Show clear success and error feedback.
- Preserve unsaved form data when a request fails.
- Update the public website after a successful publish operation.
- Do not expose draft content through public endpoints.

## 9. JSON Storage on Vercel

Do not use the deployed application's local filesystem as persistent storage. Vercel Functions have a read-only deployment filesystem; temporary storage is not a durable content store.

Use Vercel Blob to store a JSON object, for example:

```text
empower-content.json
```

### Storage operations

Implement server-side functions to:

1. Read the current JSON document.
2. Validate and parse the document.
3. Apply the requested content change.
4. Validate the complete updated document.
5. Write the updated JSON document to Vercel Blob.
6. Return a safe response to the client.

Use the Vercel Blob SDK and its current documented APIs. Confirm the correct read, write, overwrite, and access settings during implementation.

### Concurrency and data integrity

A single JSON document is suitable for a small CMS with modest write volume, but simultaneous admin updates can overwrite one another if writes are not coordinated.

- Avoid silently losing concurrent changes.
- Use a server-side update strategy that checks the current document version or equivalent storage state before writing.
- If reliable conditional writes or concurrency control are not available with the selected Blob API, document the limitation and recommend a database before production use with multiple simultaneous editors.
- Validate the full document before every write.
- Keep a recoverable backup or version history where practical.

### Public access

Choose the least-privileged storage access pattern that supports the application:

- Keep the source JSON private if practical.
- Expose only published content through a public read API.
- Never expose draft content or private metadata.
- Do not return storage credentials or internal storage details to the browser.

## 10. API Design

Use Vercel Serverless Functions for server-side content access.

Suggested API responsibilities:

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/content` | Public | Return published content only |
| GET | `/api/admin/content` | Admin | Return all content, including drafts |
| PUT | `/api/admin/content` | Admin | Validate and save the content document |
| GET | `/api/admin/session` | Authenticated | Verify the current admin session |

The exact endpoint structure may be adjusted to fit Vercel's routing conventions and the final application architecture.

For each protected request:

- Read the bearer token from the request.
- Verify it with Supabase Auth using a server-side trusted method.
- Confirm the user is authorized as an administrator.
- Reject missing, invalid, expired, or unauthorized sessions.
- Validate the submitted data on the server, even if the frontend already validates it.

Use appropriate status codes, including `400`, `401`, `403`, `404`, `409`, and `500` where applicable.

## 11. Suggested Project Structure

```text
empower-faqs/
├── api/
│   ├── content.ts
│   └── admin/
│       ├── content.ts
│       └── session.ts
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── faq/
│   │   ├── video/
│   │   └── admin/
│   ├── features/
│   │   ├── authentication/
│   │   ├── categories/
│   │   └── content/
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── AdminLoginPage.tsx
│   │   └── AdminDashboardPage.tsx
│   ├── services/
│   │   ├── contentService.ts
│   │   └── youtubeService.ts
│   ├── types/
│   │   └── content.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── hooks/
│   ├── styles/
│   └── main.tsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

Adjust the structure to the actual Vercel Functions routing setup. Avoid creating empty folders or unnecessary abstraction layers.

## 12. Environment Variables

Create `.env.example` with variable names and placeholder values only.

Expected server-side variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BLOB_READ_WRITE_TOKEN=
```

Expected client-side variables, if required by the selected Supabase client setup:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Rules:

- Never prefix privileged secrets with `VITE_`.
- Never commit real credentials.
- Configure production secrets in Vercel project settings.
- Use separate development and production credentials where appropriate.
- Do not use the service role key in browser code.

## 13. Responsive Design and Accessibility

- Match the reference website's responsive behavior.
- Test desktop, tablet, and mobile layouts.
- Avoid horizontal overflow.
- Keep cards and text readable at narrow widths.
- Use semantic HTML elements.
- Ensure interactive elements are keyboard accessible.
- Provide visible focus states.
- Use accessible labels for forms and icon-only buttons.
- Ensure dialogs can be closed with the keyboard.
- Use appropriate alternative text for meaningful images.
- Respect reduced-motion preferences.

## 14. Testing and Verification

### Reference replication

- Compare implementation screenshots with the reference website.
- Verify page structure, typography, spacing, colors, and card dimensions.
- Test navigation, expandable sections, and video interactions.
- Check responsive behavior at representative viewport sizes.

### CMS

- Sign in with an authorized admin.
- Reject unauthenticated and unauthorized write requests.
- Create, edit, delete, reorder, draft, and publish content.
- Verify form validation.
- Verify that failed saves do not discard unsaved changes.
- Verify that public users cannot retrieve drafts.

### YouTube

- Test standard watch URLs.
- Test shortened URLs.
- Test Shorts URLs.
- Test embed URLs.
- Reject invalid URLs.
- Verify thumbnail previews and video playback.

### Storage

- Create content and verify it persists after a page reload.
- Verify it remains available after a new deployment.
- Verify malformed JSON cannot replace valid content.
- Test concurrent updates or document the remaining limitation.
- Verify storage credentials are never exposed to the browser.

### Production

- Run linting and TypeScript checks.
- Run the production build.
- Test the deployed public website.
- Test the deployed admin workflow.
- Review Vercel function logs for errors.
- Confirm environment variables are configured correctly.

## 15. Implementation Phases

### Phase 1 — Inspect and document

- Inspect the reference website.
- Record its page structure and visual patterns.
- Test its interactive behavior.
- Capture desktop and mobile screenshots.
- Identify the content types and fields required.

**Deliverable:** Reference UI notes and implementation checklist.

### Phase 2 — Project foundation

- Inspect the existing repository before changing files.
- Configure Vite, React, and TypeScript.
- Configure Tailwind CSS and routing.
- Add only necessary dependencies.
- Establish the initial component and feature structure.

**Deliverable:** Running project foundation.

### Phase 3 — Public website replication

- Build the page layout.
- Implement reusable FAQ and video components.
- Match the reference styling and interactions.
- Implement responsive behavior.
- Use temporary local fixture data only until the API is ready.

**Deliverable:** Public website matching the reference as closely as practical.

### Phase 4 — Authentication and admin access

- Configure Supabase Auth.
- Build the admin login page.
- Protect admin routes.
- Implement server-side admin authorization.

**Deliverable:** Secure admin access.

### Phase 5 — CMS implementation

- Build the admin dashboard.
- Implement category management.
- Implement FAQ and video card forms.
- Implement YouTube URL validation and thumbnail generation.
- Implement draft, publish, delete, and reorder operations.

**Deliverable:** Functional content management interface.

### Phase 6 — Persistent JSON storage

- Configure Vercel Blob.
- Implement server-side JSON read and write operations.
- Add schema validation and safe error handling.
- Address concurrent update risks.
- Connect the admin CMS to persistent storage.

**Deliverable:** Persistent JSON-backed CMS.

### Phase 7 — Public content integration

- Connect the public website to the content API.
- Display published content only.
- Add loading, empty, and error states.
- Verify that admin updates appear on the public website.

**Deliverable:** Fully integrated public website and CMS.

### Phase 8 — Testing and deployment

- Run automated and manual tests.
- Compare the website with the reference.
- Verify authentication and API security.
- Configure Vercel environment variables.
- Deploy and verify production behavior.

**Deliverable:** Production-ready Vercel deployment.

## 16. Acceptance Criteria

The project is complete when all of the following are true:

- [ ] The public website closely matches the reference website.
- [ ] Desktop, tablet, and mobile layouts work correctly.
- [ ] Public content is loaded from the JSON-backed API.
- [ ] Admin login works through Supabase Auth.
- [ ] Only authorized administrators can modify content.
- [ ] Administrators can create, edit, delete, and reorder categories and cards.
- [ ] Administrators can save drafts and publish content.
- [ ] Administrators can create video cards using YouTube URLs.
- [ ] YouTube thumbnails are generated and previewed automatically.
- [ ] Published videos open or play correctly.
- [ ] Content persists in Vercel Blob after redeployment.
- [ ] Draft content is not visible through the public API.
- [ ] Privileged credentials are not exposed to the browser.
- [ ] TypeScript checks and production builds pass.
- [ ] Important errors and unresolved limitations are documented.

## 17. Scope Constraints

- Preserve the reference website's existing visual identity and behavior.
- Do not redesign unrelated sections.
- Do not introduce unrelated features.
- Do not hardcode production content in UI components.
- Do not use the Vercel deployment filesystem as persistent storage.
- Do not expose Supabase service role or Vercel Blob credentials.
- Do not add a traditional database unless requirements or storage limitations justify it.
- Prefer improving existing code over replacing working implementations.
- Keep components and services focused on clear responsibilities.
- Avoid unnecessary abstractions, dependencies, and configuration.
- Update documentation when implementation details change.

## 18. Technical Decision to Revisit

A single JSON document in Vercel Blob is a simple starting point for a small, low-write-volume CMS. It is not equivalent to a transactional database. If multiple administrators need to edit content concurrently, or if the content grows substantially, evaluate Supabase Postgres or another database for structured content storage.

The initial implementation should use Vercel Blob JSON as requested, while keeping storage access behind a server-side service boundary so it can be replaced later without rewriting the public UI or admin forms.
