# Gemini Real-time Voice Assistant

This is a multimodal, real-time AI assistant that listens to your voice or accepts text input and responds in text, powered by the Google Gemini API. It includes features like customizable prompts, file attachments for context, real-time transcription, and a detailed metrics panel to monitor performance and cost.

For a full breakdown of features, architecture, and API usage, please see the [**Full Documentation**](./docs/DOCUMENTATION.md).

---

## Features Overview

-   **Dual Input Modes**: Seamlessly switch between voice (real-time transcription) and text input.
-   **Contextual Understanding**: Attach images, PDFs, DOCX, and TXT files, or add private text data for context-aware conversations.
-   **Transcribe Browser Tab Audio**: Directly capture and transcribe audio from another browser tab using the Gemini API, perfect for meetings, videos, or live streams. A legacy mode for virtual audio devices is also available.
-   **Customizable & Responsive UI**: Modern, responsive interface with a detailed settings panel to customize the AI's persona, select microphones, and monitor session metrics.
-   **Performance & Cost Tracking**: Integrated metrics to track token usage, response times, and estimate session costs.

---

## Prerequisites

-   A modern web browser that supports the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) and the [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API) (e.g., Chrome, Edge).
-   A working microphone.
-   [Docker](https://www.docker.com/get-started) installed on your system.
-   A Google Gemini API key.

## Configuration

The application requires a Google Gemini API key to function.

1.  **Get an API Key**: Obtain your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Set Environment Variable**: The API key **must** be provided as an environment variable named `API_KEY` when running the Docker container.

## How to Run with Docker

This application is designed to be run in a Docker container, which simplifies setup and ensures a consistent environment.

1.  **Build the Docker image:**
    Open a terminal in the project's root directory and run:
    ```sh
    docker build -t gemini-voice-assistant .
    ```

2.  **Run the Docker container:**
    Replace `your_gemini_api_key_here` with your actual Gemini API key.
    ```sh
    docker run -p 8080:80 -e API_KEY=your_gemini_api_key_here --name gemini-assistant gemini-voice-assistant
    ```
    -   `-p 8080:80`: Maps port 8080 on your local machine to port 80 inside the container.
    -   `-e API_KEY=...`: Securely passes your API key into the container as an environment variable.
    -   `--name gemini-assistant`: Assigns a convenient name to your running container.

3.  **Access the application:**
    Open your web browser and navigate to `http://localhost:8080`.

4.  **To stop the container:**
    ```sh
    docker stop gemini-assistant
    ```

5.  **To remove the container:**
    ```sh
    docker rm gemini-assistant
    ```

## Development & Debugging

The application is instrumented with a detailed logger. To see a real-time log of events, state changes, API calls, and performance metrics, open your browser's **Developer Tools** and view the **Console**. This is the best way to understand the application's internal state and debug any issues.

## Project Structure

```
/
├── Dockerfile                # Instructions to build the Docker image
├── nginx.conf                # Nginx configuration for serving the app
├── entrypoint.sh             # Script to inject API key at runtime
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
