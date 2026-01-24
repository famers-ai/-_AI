from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import dashboard, ai, forecast, market

app = FastAPI(title="Smart Farm AI API", version="1.0.0")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(ai.router, prefix="/api/ai")
app.include_router(forecast.router, prefix="/api/pest")
app.include_router(market.router, prefix="/api/market")

@app.get("/")
def read_root():
    return {"message": "Smart Farm AI Backend is Running 🚜", "status": "active"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
