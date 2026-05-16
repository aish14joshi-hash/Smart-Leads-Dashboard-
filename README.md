# Smart Leads Dashboard

An AI-powered CRM dashboard built for high-performance sales teams. This application leverages the Google Gemini API to provide tactical insights on sales leads and uses Firebase for real-time data management.

## 🚀 Live Demo
**[View Live Application](https://ais-pre-k755eeal7mkqov4xswmazx-232873291335.asia-east1.run.app)**

---

## 🛠 Features
- **Smart Lead Analysis**: Uses Gemini 2.0 Flash to generate 3 bullet-point tactical strategies for every lead.
- **Real-time Synchronization**: Powered by Firestore snapshots for immediate updates across all clients.
- **Advanced Filtering**: Filter by status, source, and smart search.
- **Quality Scoring**: Visual indicators for lead potential.
- **Secure Authentication**: Protected via Firebase Auth and granular Security Rules.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Google Cloud/Firebase project

### Local Installation
1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd smart-leads-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: The `VITE_` prefix is not required here because it is handled in `vite.config.ts` via the `define` property.)*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## 📖 API Documentation

### Data Models (Firestore)
- **Leads Collection (`/leads`)**: Stores lead profile, source, status, and AI-generated `smartInsight`.
- **Users Collection (`/users`)**: Stores user roles and profiles.

### Key Logic & Services
- **`leadService.ts`**: Handles CRUD operations and complex queries on Firestore.
- **`geminiService.ts`**: Manages the integration with `@google/genai` for lead analysis.

---

## 🛡️ Security
The application implements strict **Firestore Security Rules** to ensure:
- Users can only read/write their own data (or as authorized).
- Mandatory data validation on all writes.
- Protection against PII leaks.

---

## 📁 Repository Structure
- `src/components/`: UI components (Dashboard, LeadDialog, etc.)
- `src/services/`: Backend service integrations (Firebase, Gemini)
- `src/hooks/`: Custom React hooks for data fetching and state.
- `firestore.rules`: Security configuration.
