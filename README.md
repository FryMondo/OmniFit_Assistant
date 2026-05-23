# OmniFit Assistant

OmniFit Assistant is an intelligent, voice-controlled application designed to generate personalized fitness workout programs and parse nutrition data. Built with a modern React frontend and a Node.js backend, it leverages the power of the Google Gemini AI API and natural language processing (NLP) to understand user intent, validate safety constraints (e.g., injuries), and deliver highly customized results.

## Features
* **Zero-UI Voice Input:** Speak your fitness goals or meals directly into the microphone (Ukrainian language supported).
* **Smart Intent Recognition:** The AI distinguishes between valid fitness requests and absurd or unrelated text.
* **Safety First:** Strict validation ensures that workout plans are not generated without explicit knowledge of the user's injury status.
* **Dynamic Workout Generation:** Creates specific training routines (Full Body, Split, PPL, HIIT) mathematically adjusted for experience level, available equipment, and specific injuries.
* **Nutrition Parsing:** Extracts food items, weights, and calories from natural speech into structured JSON.

## Getting Started

### 1. Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* Git

### 2. Installation
Clone the repository to your local machine:
```bash
git clone https://github.com/FryMondo/OmniFit_Assistant.git
cd OmniFit_Assistant
```

Since the node_modules folders are excluded from version control, you need to install the dependencies for both the backend and frontend separately.

Install Backend Dependencies:
```bash
cd backend
npm install
```

Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

### 3. Environment Variables & API Key
To use the AI features, you need a Google Gemini API Key.

1. Go to Google AI Studio and create a free API key.
2. In the backend folder, create a new file named .env.
3. Add your API key to the .env file in the following format:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

## Running the Project
You will need to open two separate terminal windows to run the backend server and the frontend client simultaneously.

Terminal 1: **Start the Backend** (Node.js/Express)
```bash
npm run backend
```

Terminal 2: **Start the Frontend** (React/Vite)
```bash
npm run frontend
```

## Testing
The backend business logic and AI validation rules are covered by automated unit tests using Jest.

To run the tests:
```bash
cd backend
npm test
```

You can also test backend business logic manually by changing and running file [main.ts](https://github.com/FryMondo/OmniFit_Assistant/blob/master/backend/main.ts)
