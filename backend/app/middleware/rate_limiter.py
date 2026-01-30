"""
Rate Limiting Middleware for API Protection
Prevents DoS attacks and API abuse
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple
import time

class RateLimiter:
    def __init__(self):
        # Store: {ip_address: [(timestamp, endpoint), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        
        # Rate limits per endpoint type
        self.limits = {
            "dashboard": (30, 60),  # 30 requests per 60 seconds
            "market": (20, 60),     # 20 requests per 60 seconds
            "pest": (20, 60),       # 20 requests per 60 seconds
            "ai": (10, 60),         # 10 requests per 60 seconds (expensive)
            "default": (60, 60)     # 60 requests per 60 seconds for others
        }
    
    def _clean_old_requests(self, ip: str, window: int):
        """Remove requests older than the time window"""
        cutoff = time.time() - window
        self.requests[ip] = [
            (ts, endpoint) for ts, endpoint in self.requests[ip]
            if ts > cutoff
        ]
    
    def _get_endpoint_category(self, path: str) -> str:
        """Categorize endpoint for rate limiting"""
        if "/dashboard" in path:
            return "dashboard"
        elif "/market" in path:
            return "market"
        elif "/pest" in path:
            return "pest"
        elif "/ai" in path:
            return "ai"
        else:
            return "default"
    
    def check_rate_limit(self, request: Request) -> Tuple[bool, str]:
        """
        Check if request should be rate limited
        Returns (is_allowed, message)
        """
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get endpoint category
        category = self._get_endpoint_category(request.url.path)
        max_requests, window = self.limits[category]
        
        # Clean old requests
        self._clean_old_requests(client_ip, window)
        
        # Count recent requests for this category
        recent_requests = [
            ts for ts, endpoint in self.requests[client_ip]
            if self._get_endpoint_category(endpoint) == category
        ]
        
        if len(recent_requests) >= max_requests:
            retry_after = int(window - (time.time() - recent_requests[0]))
            return False, f"Rate limit exceeded. Try again in {retry_after} seconds."
        
        # Record this request
        self.requests[client_ip].append((time.time(), request.url.path))
        
        return True, ""

# Global rate limiter instance
rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware to apply rate limiting to all requests
    """
    # Skip rate limiting for health checks and static files
    if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
        return await call_next(request)
    
    # Check rate limit
    is_allowed, message = rate_limiter.check_rate_limit(request)
    
    if not is_allowed:
        return JSONResponse(
            status_code=429,
            content={
                "detail": message,
                "error": "Too Many Requests"
            },
            headers={"Retry-After": "60"}
        )
    
    # Process request
    response = await call_next(request)
    
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = "60"
    response.headers["X-RateLimit-Remaining"] = "50"  # Simplified
    
    return response
