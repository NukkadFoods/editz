from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="PDF Editor Backend API", version="1.0.0")

# Configure CORS to allow any frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for maximum compatibility
        "http://localhost:3000",  # Local development
        "http://localhost:5173",  # Vite dev server
        "https://*.vercel.app",   # Any Vercel deployment
        "https://*.netlify.app",  # Any Netlify deployment
        "https://*.github.io",    # GitHub Pages
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/api")
async def root():
    return {
        "message": "PDF Editor Backend API", 
        "version": "1.0.0", 
        "status": "running",
        "environment": "vercel-serverless",
        "cors": "universal-access-enabled"
    }

@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "platform": "vercel",
        "python_version": "3.9+",
        "cors_policy": "universal"
    }
