import os
import asyncpg
from typing import List, Dict

# PostgreSQL Connection String
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/kochi_metro_db")

class SpatialDatabase:
    def __init__(self):
        self.pool = None

    async def connect(self):
        """Initialize connection pool to PostgreSQL"""
        self.pool = await asyncpg.create_pool(DATABASE_URL)

    async def disconnect(self):
        await self.pool.close()

    async def get_all_trains_spatial(self) -> List[Dict]:
        """Fetches trains and extracts GeoJSON coordinates from PostGIS points"""
        query = """
            SELECT 
                t.id, 
                t.current_bay_id AS stabling_bay, 
                t.status AS displayStatus,
                t.brake_wear_pct, 
                t.motor_temp_c, 
                t.sla_hours_needed AS sla_hours,
                ST_Y(t.current_position) AS lat,
                ST_X(t.current_position) AS lng
            FROM trains t;
        """
        async with self.pool.acquire() as connection:
            records = await connection.fetch(query)
            return [dict(record) for record in records]

    async def update_train_telemetry_spatial(self, train_id: str, lat: float, lng: float, temp: float, brake: float, bay: int):
        """Updates train metrics and updates PostGIS geometry Point natively"""
        query = """
            UPDATE trains 
            SET 
                current_position = ST_SetSRID(ST_MakePoint($1, $2), 4326),
                motor_temp_c = $3,
                brake_wear_pct = $4,
                current_bay_id = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6;
        """
        async with self.pool.acquire() as connection:
            await connection.execute(query, lng, lat, temp, brake, bay, train_id)

db = SpatialDatabase()