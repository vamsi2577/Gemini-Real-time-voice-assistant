# Gemini Real-time Voice Assistant

This is a multimodal, real-time AI assistant that listens to your voice and responds in text, powered by the Google Gemini API. It includes features like customizable prompts, real-time transcription, and a detailed metrics panel to monitor performance and cost.

For a full breakdown of features, architecture, and API usage, please see the [**Full Documentation**](./docs/DOCUMENTATION.md).

---

## Prerequisites

-   A modern web browser that supports the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (e.g., Chrome, Edge).
-   A working microphone.

## Configuration

The application requires a Google Gemini API key to function.

1.  **Get an API Key**: Obtain your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Enter the Key in the App**: Open the application, click the settings (gear) icon in the top right, and paste your API key into the "Gemini API Key" field.

The key is automatically saved to your browser's local storage, so you don't need to re-enter it every time you visit the page.

## How to Run

This is a static web application built with React and TypeScript.

1.  Serve the project files from any local web server.
2.  Open `index.html` in your browser.
3.  Enter your API key as described in the Configuration section above.

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
