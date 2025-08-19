from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

app = FastAPI(title="PDF Editor Backend API", version="1.0.0")

# Configure CORS to allow any frontend domain with explicit settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for maximum compatibility
        "https://editz-one.vercel.app",
        "https://editz-*.vercel.app", 
        "https://*.vercel.app",   # Any Vercel deployment
        "https://*.netlify.app",  # Any Netlify deployment
        "https://*.github.io",    # GitHub Pages
        "http://localhost:3000",  # Local development
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=False,  # Set to False for public APIs
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "*",
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
    expose_headers=["*"],
)

@app.get("/")
@app.get("/api")
async def root():
    response = {
        "message": "PDF Editor Backend API", 
        "version": "1.0.0", 
        "status": "running",
        "environment": "vercel-serverless",
        "cors": "universal-access-enabled"
    }
    return JSONResponse(
        content=response,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.get("/api/health")
@app.get("/health")
async def health_check():
    response = {
        "status": "healthy",
        "platform": "vercel",
        "python_version": "3.9+",
        "cors_policy": "universal"
    }
    return JSONResponse(
        content=response,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )
