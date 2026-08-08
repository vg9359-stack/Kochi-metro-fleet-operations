import os
import asyncio
import random
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# -------------------------------------------------------------------
# 1. OPTIONAL DATABASE (asyncpg for PostgreSQL/PostGIS)
# -------------------------------------------------------------------
try:
    import asyncpg
    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/kochi_metro_db")

# -------------------------------------------------------------------
# 2. OR-TOOLS ILP SOLVER IMPORT GUARD
# -------------------------------------------------------------------
try:
    from ortools.linear_solver import pywraplp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False

app = FastAPI(title="MetroMind Optimization, PostGIS & Live Telemetry API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# 3. BASE FLEET DATASET & IN-MEMORY STORES
# -------------------------------------------------------------------
FLEET_DATABASE = [
    {
        "id": f"TS-{i:02d}",
        "train_number": f"TS-{i:02d}",
        "stabling_bay": i,
        "is_maintenance_blocked": True if i in [3, 8, 14, 19] else False,
        "status": "MAINTENANCE" if i in [3, 8, 14, 19] else "INDUCTION_READY",
        "mileage_km": 12000 + (i * 1850) % 45000,
        "branding_sla_hours_needed": round((i * 3.5) % 36.0, 1),
        "motor_temp_c": 65 + (i * 2) % 25,
        "brake_wear_pct": 90 if i in [3, 8, 14, 19] else (20 + (i * 3) % 60),
        "lat": 9.9816 + (i * 0.0002),
        "lng": 76.2999 + (i * 0.0002)
    }
    for i in range(1, 26)
]

AUDIT_LOG_STORE = []

# -------------------------------------------------------------------
# 4. WEBSOCKET CONNECTION MANAGER
# -------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# -------------------------------------------------------------------
# 5. REQUEST SCHEMAS (PYDANTIC)
# -------------------------------------------------------------------
class OptimizeRequest(BaseModel):
    required_trains: Optional[int] = 15

class OverridePayload(BaseModel):
    train_id: str
    stabling_bay: int
    previous_status: str
    new_status: str
    reason_code: str
    notes: Optional[str] = ""

class TelemetryUpdate(BaseModel):
    train_id: str
    lat: float
    lng: float
    motor_temp_c: float
    brake_wear_pct: float
    stabling_bay: int

# -------------------------------------------------------------------
# 6. API ENDPOINTS
# -------------------------------------------------------------------
@app.get("/")
def health_check():
    return {
        "status": "ONLINE",
        "ortools_enabled": ORTOOLS_AVAILABLE,
        "asyncpg_installed": HAS_ASYNCPG
    }

@app.get("/api/v1/trains")
def get_fleet():
    """Returns full active fleet state"""
    return {"status": "SUCCESS", "data": FLEET_DATABASE}

@app.post("/api/optimize-induction")
def optimize_induction(payload: Optional[OptimizeRequest] = None):
    req_trains = payload.required_trains if payload else 15

    # Branch 1: OR-Tools Integer Linear Programming (ILP) Solver
    if ORTOOLS_AVAILABLE:
        solver = pywraplp.Solver.CreateSolver('SCIP')
        if solver:
            x = {i: solver.IntVar(0, 1, f"train_{train['id']}") for i, train in enumerate(FLEET_DATABASE)}

            # Constraint 1: Induct requested number of trains
            solver.Add(solver.Sum([x[i] for i in range(len(FLEET_DATABASE))]) == req_trains)

            # Constraint 2: Maintenance blocked trains CANNOT be inducted
            for i, train in enumerate(FLEET_DATABASE):
                if train["is_maintenance_blocked"]:
                    solver.Add(x[i] == 0)

            # Objective: Maximize Branding SLA while Minimizing Mileage Wear
            objective = solver.Objective()
            for i, train in enumerate(FLEET_DATABASE):
                score = (train["branding_sla_hours_needed"] * 100) - (train["mileage_km"] * 0.01)
                objective.SetCoefficient(x[i], score)
            
            objective.SetMaximization()
            solver.Solve()

            processed_fleet = []
            for i, train in enumerate(FLEET_DATABASE):
                is_inducted = bool(x[i].solution_value() > 0.5)
                status = train.get("status", "INDUCTION_READY")
                if train["is_maintenance_blocked"]:
                    status = "MAINTENANCE"
                elif is_inducted:
                    status = "INDUCTION_READY" if status != "EXPRESS_INDUCTION" else "EXPRESS_INDUCTION"
                else:
                    status = "STANDBY"

                entry = dict(train)
                entry["displayStatus"] = status
                entry["status"] = status
                processed_fleet.append(entry)

            return {
                "source": "OR_TOOLS_SOLVER",
                "total_trains": len(processed_fleet),
                "inducted_count": req_trains,
                "induction_schedule": processed_fleet
            }

    # Branch 2: Heuristic Fallback
    processed_fleet = []
    for train in FLEET_DATABASE:
        status = train.get("status", "INDUCTION_READY")
        if train["is_maintenance_blocked"]:
            status = "MAINTENANCE"
        entry = dict(train)
        entry["displayStatus"] = status
        processed_fleet.append(entry)

    return {
        "source": "HEURISTIC_FALLBACK",
        "total_trains": len(processed_fleet),
        "induction_schedule": processed_fleet
    }

@app.post("/api/override-dispatch")
def log_dispatch_override(payload: OverridePayload):
    audit_entry = payload.model_dump() if hasattr(payload, 'model_dump') else payload.dict()
    AUDIT_LOG_STORE.append(audit_entry)

    # Sync state update in FLEET_DATABASE
    for train in FLEET_DATABASE:
        if train["id"] == payload.train_id:
            train["status"] = payload.new_status
            train["is_maintenance_blocked"] = (payload.new_status == "MAINTENANCE")

    return {
        "status": "SUCCESS",
        "message": f"Dispatch override logged for {payload.train_id}.",
        "audit_record": audit_entry
    }

@app.post("/api/v1/trains/{train_id}/repair")
async def repair_train(train_id: str):
    """Clears maintenance block for a train and elevates it to Express Induction"""
    for train in FLEET_DATABASE:
        if train["id"] == train_id:
            train["brake_wear_pct"] = 15.0
            train["motor_temp_c"] = 55.0
            train["is_maintenance_blocked"] = False
            train["status"] = "EXPRESS_INDUCTION"
            
            # Broadcast state update across connected WebSockets
            await manager.broadcast({
                "type": "TELEMETRY_STREAM",
                "updatedTrain": train,
                "data": FLEET_DATABASE
            })
            return {
                "status": "SUCCESS",
                "message": f"Train {train_id} successfully repaired and upgraded to EXPRESS_INDUCTION",
                "data": train
            }
            
    raise HTTPException(status_code=404, detail="Train not found")

# -------------------------------------------------------------------
# 7. REAL-TIME WEBSOCKET STREAMING ENDPOINT
# -------------------------------------------------------------------
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial fleet payload
        await websocket.send_json({"type": "FLEET_UPDATE", "data": FLEET_DATABASE})

        while True:
            await asyncio.sleep(3)
            
            target_train = random.choice(FLEET_DATABASE)
            
            # 1. Update active metrics if not locked in heavy maintenance
            if target_train["status"] != "MAINTENANCE":
                target_train["motor_temp_c"] = max(50, min(110, target_train["motor_temp_c"] + random.randint(-2, 3)))
                target_train["brake_wear_pct"] = max(10, min(100, target_train["brake_wear_pct"] + random.choice([0, 1])))

            # 2. CATEGORIZATION LOGIC
            # Severe damage -> Route to MAINTENANCE Bay
            if target_train["brake_wear_pct"] > 85:
                target_train["is_maintenance_blocked"] = True
                target_train["status"] = "MAINTENANCE"

            # Overheating only -> Route to STANDBY to cool down
            elif target_train["motor_temp_c"] > 88 and target_train["status"] != "MAINTENANCE":
                target_train["status"] = "STANDBY"
                target_train["motor_temp_c"] = max(50, target_train["motor_temp_c"] - 4)

            # Gradual cooling on Standby restores operational status
            elif target_train["status"] == "STANDBY" and target_train["motor_temp_c"] <= 75:
                target_train["status"] = "INDUCTION_READY"

            await manager.broadcast({
                "type": "TELEMETRY_STREAM",
                "updatedTrain": target_train,
                "data": FLEET_DATABASE
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)