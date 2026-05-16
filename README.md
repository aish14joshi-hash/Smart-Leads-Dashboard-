# Smart Leads Dashboard - API & Developer Documentation

Welcome to the **Smart Leads Dashboard** documentation. This document outlines the architecture, data models, and service interfaces for the application.

## 1. System Architecture
The application is built as a highly responsive full-stack web application using the following stack:
- **Frontend**: React 18+ with Vite (TypeScript).
- **Styling**: Tailwind CSS with custom thematic variables for a technical, high-contrast UI.
- **Backend**: Firebase (Firestore & Authentication).
- **Intelligence Layer**: Google Gemini API for tactical lead analysis.

---

## 2. Data Models (Firestore)

### Lead Entity
The primary record in the system representing a potential customer.
- **Path**: `/leads/{leadId}`
- **Fields**:
  - `id`: Unique identifier (string).
  - `name`: Full name of the lead (string).
  - `email`: Contact email address (string).
  - `phone`: Contact phone number (string).
  - `status`: Lifecycle state (`New` | `Contacted` | `Qualified` | `Lost`).
  - `source`: Acquisition origin (`Website` | `Instagram` | `Referral` | `LinkedIn` | `Facebook` | `Cold Call`).
  - `qualityScore`: Relative lead importance (number, 1-10).
  - `notes`: Custom textual context (string).
  - `smartInsight`: AI-generated tactical strategy (string, optional).
  - `createdAt`: Server-side creation timestamp.
  - `updatedAt`: Last modification timestamp.
  - `createdBy`: UID of the user who created the lead.

### User Entity
Internal record for application users and permissions.
- **Path**: `/users/{userId}`
- **Fields**:
  - `uid`: Firebase Auth UID.
  - `email`: Authenticated email address.
  - `role`: Permission level (`Admin` | `Sales User`).
  - `name`: Display name.

---

## 3. Core Services API

### `leadService` (Internal)
Located at `src/services/leadService.ts`, this service handles all direct interactions with the Firestore `leads` collection.

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `createLead` | `leadData` | Creates a new lead with server timestamps and auth tracking. |
| `updateLead` | `id`, `leadData` | Updates existing lead attributes. |
| `deleteLead` | `id` | Permanently removes a lead record. |
| `getLeads` | `filters` | Queries leads with support for filtering, sorting, pagination, and client-side searching. |

### `geminiService` (Intelligence)
Located at `src/services/geminiService.ts`, this service interfaces with the Gemini 2.0 Flash model.

| Method | Parameters | Return | Description |
| :--- | :--- | :--- | :--- |
| `analyzeLead` | `lead` | `string` (3 Bullet Points) | Analyzes lead context to provide tactical sales strategies. |

---

## 4. Configuration & Environment
The following environment variables are required to be set in the build environment:

- `GEMINI_API_KEY`: API key for Google Generative AI access.
- `FIREBASE_CONFIG`: Handled automatically via `firebase-applet-config.json`.

---

## 5. Security Protocols
Security is enforced at the database level via **Firestore Security Rules**:
1. **Master Gate**: All reads/writes require authentication.
2. **Identity Integrity**: Users can only modify fields if they match standard validation rules.
3. **Data Protection**: PII like email and phone are guarded by auth checks.
