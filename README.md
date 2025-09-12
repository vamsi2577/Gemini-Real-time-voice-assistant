# Gemini Real-time Voice Assistant

This is a multimodal, real-time AI assistant that listens to your voice or accepts text input and responds in text, powered by the Google Gemini API. It includes features like customizable prompts, file attachments for context, real-time transcription, and a detailed metrics panel to monitor performance and cost.

For a full breakdown of features, architecture, and API usage, please see the [**Full Documentation**](./docs/DOCUMENTATION.md).

---

## Prerequisites

-   A modern web browser that supports the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) and the [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API) (e.g., Chrome, Edge).
-   A working microphone.
-   Node.js and a package manager (like npm or yarn) to run a development server.

## Configuration

The application requires a Google Gemini API key to function.

1.  **Get an API Key**: Obtain your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Set Environment Variable**: The API key **must** be provided as an environment variable named `API_KEY`. How you set this depends on your development server. For example, you might create a `.env` file in the project root:
    ```
    API_KEY=your_gemini_api_key_here
    ```
    Your server must be configured to load this variable and make it accessible as `process.env.API_KEY` in the client-side code. **The application will not function without it.**

## How to Run

This is a static web application built with React and TypeScript that needs to be served by a development server capable of handling environment variables.

1.  Set your `API_KEY` environment variable as described above.
2.  Serve the project files from a local web server (e.g., using Vite, Create React App, or a custom Node/Express server).
3.  Open the local server's address in your browser.

## Project Structure

```
/
├── index.html                # Main HTML entry point
├── index.tsx                 # React application root
├── App.tsx                   # Main application component
├── services/                 # Handles external API communication
├── components/               # Reusable React components
├── utils/                    # Utility functions (e.g., logger)
├── types.ts                  # TypeScript type definitions
├── docs/
│   └── DOCUMENTATION.md      # In-depth documentation file
└── README.md                 # This file: setup and running instructions
```