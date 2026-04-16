# Implementation Plan: CV Generator

## Overview

Incremental implementation starting with project setup and auth, then profile management, then AI tailoring, then export, and finally history. Each step builds on the previous and is wired together before moving forward.

## Tasks

- [ ] 1. Project setup and core types
  - Install dependencies: `@supabase/supabase-js`, `fast-check`, `jspdf`, `docx`, `vitest`, `@testing-library/react`
  - Define all TypeScript interfaces: `CVProfile`, `WorkExperience`, `Education`, `TailoredCV`, `HistoryEntry`
  - Create Supabase client singleton (`src/lib/supabase.ts`)
  - Set up Vitest config (`vitest.config.ts`)
  - _Requirements: 2.1_

- [ ] 2. Supabase database schema and Edge Function
  - [ ] 2.1 Create Supabase migration for `profiles` and `cv_history` tables with RLS policies
    - Apply the SQL schema from the design document
    - _Requirements: 2.1, 7.1_
  - [ ] 2.2 Create Supabase Edge Function `tailor-cv`
    - Accept `{ profile: CVProfile, jobDescription: string }` as input
    - Call OpenAI GPT-4o with the structured prompt from the design
    - Parse and validate the JSON response against `TailoredCV` schema
    - Return the `TailoredCV` or an error
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Authentication
  - [ ] 3.1 Implement `LoginPage` component with email/password login and registration
    - Use Supabase Auth `signInWithPassword` and `signUp`
    - Show field-level error messages on failure
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 3.2 Implement `AuthGuard` component
    - Redirect unauthenticated users to `/login`
    - Maintain session across page refreshes using Supabase `onAuthStateChange`
    - _Requirements: 1.4, 1.5_
  - [ ] 3.3 Implement `AppShell` with navigation and logout button
    - Wire logout to `supabase.auth.signOut()` and redirect to login
    - _Requirements: 1.5_

- [ ] 4. CV Profile management
  - [ ] 4.1 Implement `ProfileService` (`src/services/profileService.ts`)
    - `getProfile(userId)`: fetch from `profiles` table
    - `saveProfile(userId, profile)`: upsert to `profiles` table
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ]* 4.2 Write property test for profile round-trip
    - **Property 1: Profile round-trip consistency**
    - **Validates: Requirements 2.2, 2.3**
    - Use `fast-check` to generate random `CVProfile` objects, save via mock Supabase, retrieve, assert deep equality
    - Tag: `Feature: cv-generator, Property 1: Profile round-trip consistency`
  - [ ] 4.3 Implement `ProfilePage` component
    - Form with all fields from `CVProfile` (dynamic lists for experience, education, skills)
    - On load: call `ProfileService.getProfile` and populate form
    - On save: call `ProfileService.saveProfile`, show success/error toast
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Checkpoint — Ensure auth and profile tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Job description input and validation
  - [ ] 6.1 Implement `JobDescriptionForm` component
    - Textarea with submit button
    - Validate: reject empty or whitespace-only input with inline error
    - Validate: reject submission if no profile is saved, show prompt to complete profile
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 6.2 Write property test for empty job description rejection
    - **Property 7: Empty job description is rejected**
    - **Validates: Requirements 3.2**
    - Use `fast-check` to generate whitespace-only strings, assert submission is blocked
    - Tag: `Feature: cv-generator, Property 7: Empty job description is rejected`
  - [ ]* 6.3 Write property test for missing profile blocks generation
    - **Property 8: Profile required before generation**
    - **Validates: Requirements 3.3**
    - Simulate null profile state, assert generation is blocked for any job description input
    - Tag: `Feature: cv-generator, Property 8: Profile required before generation`

- [ ] 7. AI tailoring service and CV preview
  - [ ] 7.1 Implement `TailoringService` (`src/services/tailoringService.ts`)
    - `tailorCV(profile, jobDescription)`: call Supabase Edge Function `tailor-cv`
    - Validate response shape against `TailoredCV` interface; throw on invalid
    - _Requirements: 4.1, 4.5, 4.7_
  - [ ]* 7.2 Write property test for AI tailoring integrity
    - **Property 2: AI tailoring preserves factual integrity**
    - **Validates: Requirements 4.5**
    - Mock AI to return random subsets of profile data; assert no new items appear in output
    - Tag: `Feature: cv-generator, Property 2: AI tailoring preserves factual integrity`
  - [ ]* 7.3 Write property test for tailored skills subset
    - **Property 3: Tailored skills are a subset of profile skills**
    - **Validates: Requirements 4.4, 4.5**
    - Generate random profiles; assert every skill in `TailoredCV.skills` exists in `CVProfile.skills`
    - Tag: `Feature: cv-generator, Property 3: Tailored skills are a subset of profile skills`
  - [ ]* 7.4 Write property test for tailored experience subset
    - **Property 4: Tailored experience is a subset of profile experience**
    - **Validates: Requirements 4.3, 4.5**
    - Generate random profiles; assert every experience entry in `TailoredCV.experience` matches one in `CVProfile.experience`
    - Tag: `Feature: cv-generator, Property 4: Tailored experience is a subset of profile experience`
  - [ ] 7.5 Implement `CVTemplate` component
    - Pure presentational component rendering all CV sections: contact, summary, experience, education, skills
    - _Requirements: 5.2_
  - [ ]* 7.6 Write property test for CV template sections
    - **Property 5 (design): CV template renders all sections**
    - **Validates: Requirements 5.2**
    - Generate random `TailoredCV` objects; render `CVTemplate`; assert all section headings and data are present
    - Tag: `Feature: cv-generator, Property 5: CV template renders all sections`
  - [ ] 7.7 Implement `CVPreview` component
    - Wraps `CVTemplate` with a styled preview container
    - _Requirements: 5.1_
  - [ ] 7.8 Implement `GeneratePage` component
    - Compose `JobDescriptionForm`, loading state, `CVPreview`
    - On submit: call `TailoringService.tailorCV`, show loading indicator, render preview on success, show error banner on failure
    - _Requirements: 4.1, 4.6, 4.7, 5.1, 5.3_

- [ ] 8. Checkpoint — Ensure tailoring and preview tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. CV Export
  - [ ] 9.1 Implement `ExportService` (`src/services/exportService.ts`)
    - `generateFileName(fullName, ext)`: produce `[fullName]_CV_[YYYY-MM-DD].[ext]` (spaces → underscores)
    - `exportPDF(cv, fileName)`: use `jsPDF` to render all CV sections and trigger download
    - `exportDocx(cv, fileName)`: use `docx` library to build a Word document and trigger download
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  - [ ]* 9.2 Write property test for export file name format
    - **Property 5: Export file name format**
    - **Validates: Requirements 6.4**
    - Generate random full names and dates; assert output matches `^[\w]+_CV_\d{4}-\d{2}-\d{2}\.(pdf|docx)$`
    - Tag: `Feature: cv-generator, Property 5: Export file name format`
  - [ ] 9.3 Implement `ExportButton` component
    - Format picker dropdown (PDF / Word)
    - On selection: call appropriate `ExportService` method, show error toast on failure
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  - [ ] 9.4 Wire `ExportButton` into `GeneratePage`
    - Show `ExportButton` only when a `TailoredCV` is available in state
    - _Requirements: 5.3_

- [ ] 10. CV History
  - [ ] 10.1 Implement `HistoryService` (`src/services/historyService.ts`)
    - `saveHistory(userId, entry)`: insert into `cv_history` table
    - `getHistory(userId)`: fetch all entries ordered by `created_at DESC`
    - _Requirements: 7.1, 7.2_
  - [ ]* 10.2 Write property test for history round-trip
    - **Property 6: History entries preserve tailored CV content**
    - **Validates: Requirements 7.1**
    - Generate random `TailoredCV` objects; save to mock store; retrieve; assert deep equality
    - Tag: `Feature: cv-generator, Property 6: History entries preserve tailored CV content`
  - [ ]* 10.3 Write property test for history ordering
    - **Property (7.2): History is ordered most recent first**
    - **Validates: Requirements 7.2**
    - Generate random sets of history entries with random timestamps; assert retrieved list is sorted descending by `createdAt`
    - Tag: `Feature: cv-generator, Property 7.2: History is ordered most recent first`
  - [ ] 10.4 Wire `HistoryService.saveHistory` into `GeneratePage`
    - After a successful AI tailoring call, save the entry to history
    - _Requirements: 7.1_
  - [ ] 10.5 Implement `HistoryPage` component
    - List past entries showing job description snippet and date
    - On click: load `TailoredCV` into preview state and navigate to generate page
    - _Requirements: 7.2, 7.3_

- [ ] 11. Wire up routing
  - Configure `react-router-dom` routes: `/login`, `/profile`, `/generate`, `/history`
  - Wrap authenticated routes with `AuthGuard`
  - _Requirements: 1.4, 1.5_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Edit tailored CV before download
  - Show the preview as an editable form so users can tweak the AI output before exporting.
  - _Requirements: User feedback integration_

- [x] 14. Job tracker
  - Implement a simple table where users log jobs they've applied to, linked to the CV they generated. Keeps everything in one place.
  - _Requirements: User feedback integration_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with minimum 100 iterations per test
- Unit tests cover specific examples and edge cases not covered by property tests


Here are the most impactful things you could add, grouped by priority:

High impact, relatively easy

Multiple CV templates — let users pick from 2–3 layouts (minimal, modern, classic) before downloading. Right now everyone gets the same look.
Cover letter generator — same idea, paste the job description and generate a tailored cover letter alongside the CV. Very high demand.
ATS score — after generating, show a rough score of how well the CV matches the job description keywords. Gemini can do this in the same call.
Password reset flow — right now there's no "forgot password" link on the login page.
AI professional rewrite — Optimize all user input sections (e.g., experience descriptions, projects) to sound more professional, rewriting informal text like "It was very hard" into "Proven record of managing pressure" while preserving facts. High user demand for polished output.
Medium impact

CV sections toggle — let users choose which sections appear in the output (e.g. hide Publications if not relevant). Some users don't have all sections.
Edit tailored CV before download — show the preview as an editable form so users can tweak the AI output before exporting.
Job tracker — a simple table where users log jobs they've applied to, linked to the CV they generated. Keeps everything in one place.
Email the CV — send the generated PDF directly to an email address from the app.
Nice to have

Dark/light mode for the CV preview — some users prefer a white preview on a white background.
Onboarding tour — a short 3-step walkthrough for new users (fill profile → paste job → download).
Usage analytics dashboard — show the user how many CVs they've generated, which roles, over time.
LinkedIn import — let users paste their LinkedIn profile URL or upload a LinkedIn PDF export to auto-fill the profile form (LinkedIn exports are standard PDFs).