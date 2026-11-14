# EMPOWER FAQ Website — Implementation Plan

## 1. Project Overview

Build a website that closely replicates the existing EMPOWER FAQ website.

Reference: https://empower-faqs.vercel.app

### Technology Stack

- Build tool: Vite
- Frontend: React
- Language: TypeScript
- Styling: Tailwind CSS
- UI components: shadcn/ui (where useful)
- Icons: Lucide React
- Routing: React Router
- Backend: Vercel Serverless Functions
- Authentication: Server-side admin password authentication
- Database: Upstash Redis via Vercel Marketplace
- Hosting: Vercel

The public website must preserve the reference website's visual appearance, layout, content hierarchy, and interaction patterns as closely as practical.

Add a separate, protected admin dashboard for managing FAQ and video cards.

## 2. Project Goals

1. Replicate the reference website as closely as possible.
2. Maintain responsive desktop, tablet, and mobile layouts.
3. Provide a protected admin dashboard.
4. Allow administrators to create, edit, delete, reorder, draft, and publish content.
5. Support YouTube video cards with automatically generated thumbnails.
6. Store content persistently in Upstash Redis.
7. Display published content dynamically on the public website.
8. Keep credentials and administrative operations server-side.

## 3. Reference Website Inspection

Before implementation, inspect the reference website.

Reference:
https://empower-faqs.vercel.app

Analyze and document:

- Page structure and section order.
- Header, navigation, and footer.
- Typography and font hierarchy.
- Colors, backgrounds, borders, and shadows.
- Spacing, sizing, and alignment.
- Card layouts and visual hierarchy.
- FAQ categories and expandable sections.
- Video cards and thumbnail presentation.
- Buttons, links, hover effects, and animations.
- Responsive behavior.
- Mobile navigation.
- Loading and empty states.

Capture desktop and mobile screenshots for visual comparison.

Do not redesign the website or replace its existing design with a generic FAQ template.

## 4. Public Website

Recreate the reference website using reusable React components.

Requirements:

- Preserve the original visual identity.
- Reproduce the existing page structure.
- Match typography, colors, spacing, and card dimensions.
- Reproduce existing interactions.
- Support responsive layouts.
- Load content dynamically from the backend API.
- Display published content only.
- Provide loading, empty, and error states.

Do not hardcode production FAQ or video content inside React components.

## 5. Admin CMS

Create a separate protected admin dashboard.

### Authentication

- Provide an admin login page.
- Use a server-side configured admin password hash.
- Never store the plaintext admin password in source code.
- Verify credentials on the server.
- Use cryptographically secure session identifiers.
- Use signed or securely validated HTTP-only session cookies.
- Set Secure cookies in production.
- Apply an appropriate SameSite policy.
- Store sessions in Upstash Redis with expiration.
- Support logout and session revocation.
- Rate-limit login attempts.
- Do not allow public admin registration.

Every protected API request must verify the admin session on the server.

### Dashboard

Display useful content statistics:

- Total cards.
- Published cards.
- Draft cards.
- Total categories.

### Content Management

Administrators must be able to:

- Create categories.
- Edit categories.
- Delete categories.
- Create FAQ cards.
- Create video cards.
- Edit existing cards.
- Delete cards.
- Save drafts.
- Publish and unpublish content.
- Reorder categories.
- Reorder cards.
- Preview content before publishing.

Require confirmation before destructive operations.

### Video Card Fields

- Title.
- Description.
- YouTube URL.
- Automatically generated YouTube video ID.
- Automatically generated thumbnail.
- Category.
- Display order.
- Publication status.

### FAQ Card Fields

Inspect the reference website and determine the appropriate FAQ fields.

At minimum, support a question/title and answer when the reference uses question-and-answer content.

## 6. YouTube Integration

Support these YouTube URL formats:

- https://www.youtube.com/watch?v=VIDEO_ID
- https://youtu.be/VIDEO_ID
- https://www.youtube.com/shorts/VIDEO_ID
- https://www.youtube.com/embed/VIDEO_ID

Extract and validate the video ID.

Generate the thumbnail automatically:

https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg

Requirements:

- Validate URLs before saving.
- Display a thumbnail preview in the admin form.
- Save the video URL and video ID.
- Display thumbnails on public cards.
- Allow users to play videos through an embedded player or the interaction used by the reference website.
- Provide a fallback when a thumbnail cannot load.

## 7. Backend and API

Use Vercel Serverless Functions.

The backend is responsible for:

- Admin authentication.
- Session validation.
- Authorization.
- Content validation.
- Redis operations.
- Public content retrieval.
- Error handling.

### Suggested API Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | /api/content | Public | Retrieve published content |
| GET | /api/admin/content | Admin | Retrieve all content |
| PUT | /api/admin/content | Admin | Save content |
| GET | /api/admin/session | Authenticated | Verify admin session |
| POST | /api/admin/login | Public | Authenticate administrator |
| POST | /api/admin/logout | Authenticated | End admin session |

Use appropriate HTTP status codes.

Validate all incoming data on the server.

Never trust client-side authorization checks.

## 8. Database — Upstash Redis

Use Upstash Redis through the Vercel Marketplace.

Do not use:

- Supabase Database.
- Supabase Auth.
- Vercel Blob.
- Local JSON files as persistent storage.
- The Vercel deployment filesystem for persistent data.

Vercel KV is discontinued for new projects. Use Upstash Redis instead.

### Data Organization

Store content using predictable Redis keys.

Example:

empower:content:v1
empower:category:{categoryId}
empower:card:{cardId}
empower:admin:session:{sessionId}

For the initial implementation, use a versioned JSON document stored in Redis.

Example content structure:

{
  "version": 1,
  "categories": [
    {
      "id": "category-001",
      "title": "Getting Started",
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

This is an example. Finalize the content structure after inspecting the reference website.

### Redis Requirements

- Use the official @upstash/redis SDK.
- Store persistent content as JSON.
- Read and write Redis data through server-side functions.
- Validate content before saving.
- Handle missing or malformed data safely.
- Avoid accidental overwrites during concurrent updates.
- Do not set expiration on permanent content.
- Use TTL for temporary admin sessions.
- Keep Redis credentials private.
- Provide a way to export or back up content.

Keep Redis access behind a server-side service so the storage implementation can be replaced later without rewriting the frontend.

## 9. Environment Variables

Configure these variables in Vercel:

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=

Rules:

- Never commit real credentials.
- Never expose Redis credentials to browser code.
- Never prefix privileged secrets with VITE_.
- Keep server-only secrets in Vercel environment settings.
- Use separate development and production credentials where appropriate.

Create an .env.example containing placeholder values only.

## 10. Suggested Project Structure

empower-faqs/
├── api/
│   ├── content.ts
│   └── admin/
│       ├── content.ts
│       ├── login.ts
│       ├── logout.ts
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
│   │   └── redis.ts
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

Adjust the structure to the actual Vercel Functions routing setup.

Avoid unnecessary folders and abstractions.

## 11. Responsive Design and Accessibility

- Match the reference website's responsive behavior.
- Support desktop, tablet, and mobile.
- Prevent horizontal overflow.
- Keep cards and text readable.
- Use semantic HTML.
- Support keyboard navigation.
- Provide visible focus states.
- Use accessible form labels.
- Ensure dialogs are keyboard accessible.
- Respect reduced-motion preferences.

## 12. Testing and Verification

### Website

- Compare screenshots against the reference.
- Verify layout and typography.
- Verify card sizes and spacing.
- Test navigation and FAQ interactions.
- Test video playback.
- Test mobile responsiveness.

### CMS

- Verify admin login.
- Reject unauthorized API requests.
- Test create, edit, delete, reorder, draft, and publish.
- Verify form validation.
- Verify error and success states.
- Confirm drafts are not publicly accessible.

### YouTube

- Test standard URLs.
- Test shortened URLs.
- Test Shorts URLs.
- Test embed URLs.
- Reject invalid URLs.
- Verify thumbnail previews.

### Redis

- Verify content persists after page reload.
- Verify content persists after redeployment.
- Verify malformed data cannot overwrite valid content.
- Test concurrent updates.
- Verify Redis credentials are not exposed.

### Production

- Run TypeScript checks.
- Run linting.
- Run production build.
- Test deployed API endpoints.
- Test the public website.
- Test admin operations.
- Review Vercel function logs.

## 13. Implementation Phases

### Phase 1 — Reference Inspection

- Inspect the live reference website.
- Document its visual patterns.
- Capture desktop and mobile screenshots.
- Identify content types and interactions.

Deliverable: Reference inspection notes.

### Phase 2 — Project Foundation

- Inspect the existing repository.
- Configure Vite, React, and TypeScript.
- Configure Tailwind CSS.
- Configure routing.
- Install only required dependencies.

Deliverable: Working project foundation.

### Phase 3 — Public Website

- Recreate the reference layout.
- Implement reusable components.
- Reproduce FAQ and video interactions.
- Implement responsive behavior.

Deliverable: Replicated public website.

### Phase 4 — Admin Authentication

- Implement admin login.
- Verify password on the server.
- Implement secure session cookies.
- Store sessions in Redis.
- Protect admin routes and APIs.

Deliverable: Protected admin access.

### Phase 5 — CMS

- Build the admin dashboard.
- Implement category management.
- Implement FAQ management.
- Implement video card management.
- Implement YouTube thumbnail generation.
- Implement draft and publish workflows.

Deliverable: Functional CMS.

### Phase 6 — Redis Integration

- Provision Upstash Redis through Vercel Marketplace.
- Configure environment variables.
- Implement content read/write operations.
- Add validation and error handling.
- Address concurrent update risks.

Deliverable: Persistent Redis-backed content.

### Phase 7 — Integration

- Connect public pages to the content API.
- Display published content.
- Add loading and error states.
- Verify admin changes appear publicly.

Deliverable: Integrated website and CMS.

### Phase 8 — Testing and Deployment

- Test the entire application.
- Compare against the reference.
- Verify API security.
- Configure production environment variables.
- Deploy to Vercel.
- Verify production functionality.

Deliverable: Production-ready website.

## 14. Acceptance Criteria

- [ ] Public website closely matches the reference.
- [ ] Desktop, tablet, and mobile layouts work.
- [ ] Public content loads dynamically from Redis.
- [ ] Admin login works.
- [ ] Only authorized administrators can modify content.
- [ ] Administrators can manage categories.
- [ ] Administrators can manage FAQ cards.
- [ ] Administrators can manage video cards.
- [ ] Administrators can save drafts and publish content.
- [ ] YouTube thumbnails generate automatically.
- [ ] YouTube videos play correctly.
- [ ] Content persists after redeployment.
- [ ] Drafts are not exposed publicly.
- [ ] Credentials remain server-side.
- [ ] TypeScript checks pass.
- [ ] Production build succeeds.

## 15. Scope Constraints

- Preserve the reference website's visual identity.
- Do not redesign unrelated sections.
- Do not introduce unrelated features.
- Do not hardcode production content in components.
- Do not use local files as persistent storage.
- Do not use Supabase.
- Do not use Vercel Blob.
- Do not expose Redis credentials.
- Avoid unnecessary dependencies and abstractions.
- Preserve existing functionality when modifying an existing project.
- Update documentation when implementation details change.

## 16. Technical Considerations

Upstash Redis is the selected key-value store.

A versioned JSON document is suitable for a small CMS with modest write volume.

However, a single JSON document can cause lost updates if multiple administrators edit simultaneously.

Use an appropriate atomic update strategy or optimistic concurrency control. If reliable concurrency handling becomes difficult, evaluate separate Redis keys or a structured database.

Keep storage operations isolated behind a server-side service so the frontend does not depend directly on Redis.