# Skill: Fast Local Development with Docker and HMR

## Goal
Set up a responsive local development environment with Hot Module Replacement (HMR) when working in a constrained environment where Node.js and NPM are not available on the host machine, and full Docker builds are too slow.

## Context
In some environments (e.g., Cloudtops or secured workstations), you might not have Node.js installed on the host. The standard workflow of building a production Docker image on every change is too slow for active development. This skill allows you to use a development server inside a container while mounting your source code from the host.

## Instructions

1.  **Ensure Docker is running** and you have access to a terminal.
2.  **Verify Application Default Credentials (ADC)** are set up on the host (needed for GCS access):
    ```bash
    gcloud auth application-default login
    ```
    
    > [!NOTE]
    > The application accesses private GCS buckets (e.g., `gs://llm-d-benchmarks-internal/`) via a backend proxy in `server/server.js`. By passing the host's ADC file into the container, the backend can use your personal GCloud credentials. The server is configured to handle `UserRefreshClient` automatically when user credentials are detected.
3.  **Run the following command** from the root of the project:
    ```bash
    docker run -d -p 8081:5173 -p 3000:3000 \
      -v $(pwd):/app \
      -v ~/.config/gcloud/application_default_credentials.json:/tmp/adc.json \
      -e GOOGLE_APPLICATION_DEFAULT_CREDENTIALS=/tmp/adc.json \
      -w /app \
      node:20-alpine \
      sh -c "npm install && npm run dev"
    ```
    
    **Parameters Explained**:
    - `-d`: Run in background.
    - `-p 8081:5173`: Map host port 8081 to Vite's dev port 5173.
    - `-p 3000:3000`: Map host port 3000 to Express backend port 3000.
    - `-v $$(pwd):/app`: Mount current workspace to `/app` in container.
    - `-v ~/.config/gcloud/...:/tmp/adc.json`: Mount your Google Cloud credentials.
    - `-e GOOGLE_APPLICATION_DEFAULT_CREDENTIALS=/tmp/adc.json`: Tell Google client library where to find credentials.
    - `-w /app`: Set working directory.
    - `node:20-alpine`: Use a light Node image.
    - `sh -c "npm install && npm run dev"`: Install dependencies and start the dev server.

## Verification
1. Check container logs: `docker logs <container_id>`
2. Wait until you see `VITE v... ready in ... ms`.
3. Access the application at `http://localhost:8081`.
4. Make a small change to a frontend file (e.g., `src/components/Milestone1Dashboard.jsx`) and verify the browser reloads instantly.
