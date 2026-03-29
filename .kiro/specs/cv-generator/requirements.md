# Requirements Document

## Introduction

A web-based CV/Resume generator and updater that allows users to store their complete professional profile once, then automatically tailor their CV to specific job descriptions using AI. The system generates a downloadable PDF or Word document with the tailored CV content, saving users time when applying to multiple jobs.

## Glossary

- **CV_Profile**: The complete set of a user's professional information stored in Supabase, including work experience, education, skills, and personal details.
- **Job_Description**: The text input provided by the user describing the role they are applying for.
- **Tailored_CV**: A version of the user's CV that has been adapted by the AI to highlight the most relevant experience and skills for a specific Job_Description.
- **AI_Service**: The AI model integration responsible for analyzing job descriptions and generating tailored CV content.
- **CV_Template**: The predefined visual layout used to render the Tailored_CV for download.
- **Export_Service**: The component responsible for converting the Tailored_CV into a downloadable PDF or Word file.
- **Auth_Service**: The Supabase authentication component managing user identity and session.
- **Profile_Store**: The Supabase database layer that persists and retrieves CV_Profile data.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to create an account and log in, so that my CV profile is securely stored and accessible only to me.

#### Acceptance Criteria

1. WHEN a user submits valid registration credentials, THE Auth_Service SHALL create a new account and log the user in.
2. WHEN a user submits valid login credentials, THE Auth_Service SHALL authenticate the user and establish a session.
3. IF a user submits invalid or missing credentials, THEN THE Auth_Service SHALL return a descriptive error message without creating a session.
4. WHILE a user session is active, THE Auth_Service SHALL maintain the session across page refreshes.
5. WHEN a user logs out, THE Auth_Service SHALL terminate the session and redirect the user to the login page.

---

### Requirement 2: CV Profile Management

**User Story:** As a user, I want to fill in my complete professional information once and save it, so that I don't have to re-enter it every time I apply for a job.

#### Acceptance Criteria

1. THE Profile_Store SHALL persist a CV_Profile containing: full name, contact details (email, phone, location, LinkedIn URL), professional summary, work experience entries (job title, company, start date, end date, description), education entries (degree, institution, graduation year), and skills list.
2. WHEN a user saves their CV_Profile, THE Profile_Store SHALL store the data and confirm the save was successful.
3. WHEN a returning user opens the profile page, THE Profile_Store SHALL retrieve and display their previously saved CV_Profile.
4. WHEN a user updates any field in their CV_Profile and saves, THE Profile_Store SHALL overwrite the previous data with the updated values.
5. IF a save operation fails, THEN THE Profile_Store SHALL display an error message and retain the unsaved data in the form.

---

### Requirement 3: Job Description Input

**User Story:** As a user, I want to paste a job description into the application, so that the AI can tailor my CV to that specific role.

#### Acceptance Criteria

1. THE CV_Generator SHALL provide a text input area where users can paste or type a Job_Description.
2. WHEN a user submits an empty Job_Description, THE CV_Generator SHALL prevent submission and display a validation error.
3. WHEN a user submits a Job_Description without a saved CV_Profile, THE CV_Generator SHALL prevent submission and prompt the user to complete their profile first.

---

### Requirement 4: AI-Powered CV Tailoring

**User Story:** As a user, I want the AI to analyze the job description and tailor my CV content, so that my application highlights the most relevant experience and skills.

#### Acceptance Criteria

1. WHEN a user submits a valid Job_Description with a saved CV_Profile, THE AI_Service SHALL analyze the Job_Description and produce a Tailored_CV.
2. THE AI_Service SHALL rewrite the professional summary to align with the Job_Description while preserving factual accuracy.
3. THE AI_Service SHALL reorder and emphasize work experience entries most relevant to the Job_Description.
4. THE AI_Service SHALL select and highlight skills from the CV_Profile that match keywords in the Job_Description.
5. THE AI_Service SHALL NOT fabricate experience, qualifications, or skills not present in the original CV_Profile.
6. WHILE the AI_Service is processing, THE CV_Generator SHALL display a loading indicator to the user.
7. IF the AI_Service fails or returns an error, THEN THE CV_Generator SHALL display a descriptive error message and allow the user to retry.

---

### Requirement 5: CV Preview

**User Story:** As a user, I want to preview the tailored CV before downloading it, so that I can verify the content looks correct.

#### Acceptance Criteria

1. WHEN the AI_Service returns a Tailored_CV, THE CV_Generator SHALL render a preview of the CV using the CV_Template.
2. THE CV_Template SHALL display all sections: contact information, professional summary, work experience, education, and skills.
3. WHILE the preview is displayed, THE CV_Generator SHALL show a download button.

---

### Requirement 6: CV Export

**User Story:** As a user, I want to download my tailored CV as a PDF or Word document, so that I can submit it to employers.

#### Acceptance Criteria

1. WHEN a user clicks the download button, THE Export_Service SHALL present the user with a choice of PDF or Word (.docx) format.
2. WHEN a user selects PDF format, THE Export_Service SHALL generate and download a PDF file of the Tailored_CV.
3. WHEN a user selects Word format, THE Export_Service SHALL generate and download a .docx file of the Tailored_CV.
4. THE Export_Service SHALL name the downloaded file using the pattern: `[full_name]_CV_[YYYY-MM-DD].[ext]`.
5. IF the export fails, THEN THE Export_Service SHALL display an error message and allow the user to retry.

---

### Requirement 7: CV History

**User Story:** As a user, I want to view previously generated tailored CVs, so that I can re-download or reference past applications.

#### Acceptance Criteria

1. WHEN a Tailored_CV is successfully generated, THE Profile_Store SHALL save a record containing the Job_Description snippet, generation timestamp, and the Tailored_CV content.
2. THE CV_Generator SHALL display a list of past Tailored_CV records for the authenticated user, ordered by most recent first.
3. WHEN a user selects a past record, THE CV_Generator SHALL render the stored Tailored_CV in the preview and allow re-download.
