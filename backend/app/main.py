from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import dashboard, ai, forecast, market, sensors, reports, users
from app.core.db_init import init_db_if_missing

app = FastAPI(title="Smart Farm AI API", version="2.0.0")

@app.on_event("startup")
async def startup_event():
    init_db_if_missing()

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ai.router, prefix="/api/ai")
app.include_router(forecast.router, prefix="/api/pest")
app.include_router(market.router, prefix="/api/market")
app.include_router(sensors.router, prefix="/api/sensors", tags=["Sensors"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
from app.api import admin
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Smart Farm AI Backend is Running 🚜", "status": "active"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
