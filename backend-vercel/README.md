# PDF Editor Backend for Vercel

Serverless FastAPI backend optimized for Vercel deployment.

## Features

- FastAPI serverless functions
- PDF upload endpoint
- Health check endpoint
- CORS configured for frontend integration

## Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `POST /api/upload/pdf` - PDF upload

## Deployment

```bash
vercel --prod
```

The backend will be available at: `https://your-project.vercel.app`
