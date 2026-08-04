
# Green Lynk Frontend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm start
   ```

The frontend expects the backend at `http://localhost:4000` by default.
When running with Docker Compose, the root `docker-compose.yml` starts the
frontend and backend as separate containers and passes `REACT_APP_API_URL` to
the frontend service.
