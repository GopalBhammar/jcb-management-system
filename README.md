# JCB Rental & Accounting Management System

A production-ready JCB Rental & Accounting Management System.

## Project Structure
- `backend/`: FastAPI Python application.
- `frontend/`: Next.js 15 Tailwind UI.
- `database/`: Database schema, migrations, and seed scripts.
- `docker/`: Local dev infrastructure via Docker Compose.
- `docs/`: Technical and API documentation.

## Running Locally

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ / 20+
- Python 3.10+

### Database
Start the database service:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Backend
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # on Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run Next.js in development mode:
   ```bash
   npm run dev
   ```
