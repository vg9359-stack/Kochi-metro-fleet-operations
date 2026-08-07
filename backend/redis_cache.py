import json
import redis
import os

# Initialize Redis Connection
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

CACHE_TTL_SECONDS = 300  # 5 Minutes TTL

def get_cached_schedule(required_trains: int):
    """Retrieve pre-computed optimization schedule from Redis cache."""
    cache_key = f"induction_schedule:req_{required_trains}"
    try:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        print(f"Redis Cache Read Error: {e}")
    return None

def set_cached_schedule(required_trains: int, result_data: dict):
    """Save computed optimization schedule into Redis cache."""
    cache_key = f"induction_schedule:req_{required_trains}"
    try:
        redis_client.setex(
            cache_key,
            CACHE_TTL_SECONDS,
            json.dumps(result_data)
        )
    except Exception as e:
        print(f"Redis Cache Write Error: {e}")

def invalidate_optimization_cache():
    """Flush cache when a train status or override is updated by an operator."""
    try:
        keys = redis_client.keys("induction_schedule:*")
        if keys:
            redis_client.delete(*keys)
    except Exception as e:
        print(f"Redis Invalidation Error: {e}")