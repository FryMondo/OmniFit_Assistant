# OmniFit Assistant

OmniFit Assistant is an intelligent, voice-controlled full-stack application designed to serve as an all-in-one ecosystem for personal fitness, nutrition tracking, and gym management. Built with a modern React frontend and a Node.js/Express backend, the platform leverages the power of the Google Gemini AI API and natural language processing (NLP) to understand user intent, validate safety constraints, parse nutrition metrics, and deliver a highly tailored experience across multiple user roles.

---

## Key Features & Role-Based Functionality

The application employs a role-based authentication structure supporting **Athletes (Sportsmen)**, **Coaches**, and **Gym Managers**, alongside public exploration features.

### 1. Athlete (Sportsman) Module
Designed to automate and optimize your personal fitness journey with minimal UI friction:
* **AI Workout Plan Generator:** Supports text or Zero-UI voice commands (with native Ukrainian language parsing). The integrated Gemini AI automatically processes inputs, adapts to your experience level, targets your primary goals, adjusts for available gym equipment, and strictly enforces safety boundaries based on your injuries or physical limitations.
* **Interactive Plan Builder:** A sleek, gesture-backed workspace to customize your training splits. Reorder days seamlessly via interface arrows, add/delete exercises manually, modify repetitions/sets, or set designated recovery rest days.
* **Live Workout Tracking:** Follow your daily protocols step-by-step. Checking off completed sets triggers a responsive floating countdown timer for rest intervals. 
* **Weekly Progress Reset:** To keep routines structured, the system securely synchronizes metrics with the cloud database and automatically resets exercise checkmarks at the start of each new calendar week (Monday).
* **AI Speech-to-Nutrition Parser:** Speak directly to your log (e.g., *"I ate oatmeal with a banana"*). The system uses Gemini NLP to break down ingredients and queries the CalorieNinjas API to populate precise daily Macronutrient (P/F/C) and Calorie charts.
* **Macro Calculator:** Instantly calculates custom daily caloric and macronutrient baselines derived from biometric inputs (age, gender, height, weight, activity multiplier, and core goal).
* **Custom Meal Repository:** Save recurring food combinations or specific recipes into a dedicated diary for rapid logging later.

### 2. Coach Module
Empowers fitness professionals to manage client rosters efficiently:
* **Roster Management:** Review incoming relationship requests from athletes and maintain a clean grid of active clients.
* **Remote Fitness Architecture:** View individual profiles, inspect recent athlete food consumption logs, and remotely edit, tweak, or completely rebuild your clients' training programs in real-time.

### 3. Gym Manager & CRM Module
A complete administrative hub for managing modern fitness facilities:
* **Multi-Gym Management:** Register and configure profiles for one or multiple commercial fitness locations, including operating schedules, locations, and branding descriptions.
* **Equipment Inventory Tracking:** Manage available gym machinery and inventory items. Set quantities and tag broken machines as "In Repair". *Note: This inventory is directly exposed to the AI generation service so clients of your gym receive workouts utilizing only functional, available equipment.*
* **Staff & Member Approvals:** Review job applications from Coaches seeking employment at your facility and manage membership entry requests from prospective clients.

### 4. Public Directory & Dashboard
* **Dynamic Dashboard:** A centralized landing hub displaying real-time nutritional balances and an overview of today's target workout. Supports arrow keys and swipe-based panel navigation.
* **Gym Catalog & Interactive Reviews:** Explore community gym facilities, verify whether a gym is currently open based on real-time hardware clock synchronization, review active coaching staffs, browse available equipment, and leave verified ratings using a 1-to-5 star evaluation system.

---

## Tech Stack

* **Frontend:** React.js, TypeScript, Vite, Custom CSS (Zero heavy template libraries for maximum performance).
* **Backend:** Node.js, Express, TypeScript, Jest (Automated testing).
* **Database & Authentication:** PostgreSQL via Supabase with extensive JSONB data serialization for fluid workout structures and nutrition history logs.
* **External APIs:** Google Gemini AI API (NLP & structural text generation), CalorieNinjas API (Nutritional verification parameters).

---

## Getting Started

### 1. Prerequisites
Ensure you have the following installed locally:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* [Git](https://git-scm.com/)

### 2. Installation
Clone the repository to your environment:
```bash
git clone [https://github.com/FryMondo/OmniFit_Assistant.git](https://github.com/FryMondo/OmniFit_Assistant.git)
cd OmniFit_Assistant
```

Install the dependencies for both the isolated backend and frontend workspaces:
#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 3. Environment Variables Configuration
Since API tokens and database keys are confidential, you must construct two separate .env files manually.

#### Backend Configuration
Create a ***.env*** file inside the ***backend/*** root folder:
```bash
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key_here
CALORIE_NINJAS_KEY=your_calorieninjas_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key
```

#### Frontend Configuration
Create a ***.env*** file inside the ***frontend/*** root folder:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_client_anonymous_public_key
VITE_API_URL=http://localhost:5000/api
```

## Running the Project
You must open two distinct terminal sessions to host the concurrent environments.

### Terminal 1: Spin up the Backend API Server (Node.js)
```bash
cd backend
npm run backend
```

### Terminal 2: Spin up the Frontend Dev Client (Vite/React)
```bash
cd frontend
npm run frontend
```

## Testing
Automated unit tests using Jest handle validation checks and backend logic evaluation.

To run the test suite:
```bash
cd backend
npm test
```

You can also run manual script validation procedures inside the backend environment using the script file: [main.ts](https://github.com/FryMondo/OmniFit_Assistant/blob/master/backend/main.ts)
