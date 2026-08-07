from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Try importing OR-Tools; use fallback logic if not installed
try:
    from ortools.linear_solver import pywraplp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False

app = FastAPI(title="MetroMind Optimization & Allocation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 25-Train Fleet Base Dataset
FLEET_DATABASE = [
    {
        "id": f"TS-{i:02d}",
        "train_number": f"TS-{i:02d}",
        "stabling_bay": i,
        "is_maintenance_blocked": True if i in [3, 8, 14, 19] else False,
        "mileage_km": 12000 + (i * 1850) % 45000,
        "branding_sla_hours_needed": round((i * 3.5) % 36.0, 1)
    }
    for i in range(1, 26)
]

# In-memory store for audit trail logs
AUDIT_LOG_STORE = []

# Request Models
class OptimizeRequest(BaseModel):
    required_trains: Optional[int] = 15

class OverridePayload(BaseModel):
    train_id: str
    stabling_bay: int
    previous_status: str
    new_status: str
    reason_code: str
    notes: Optional[str] = ""

@app.get("/")
def health_check():
    return {"status": "ONLINE", "ortools_enabled": ORTOOLS_AVAILABLE}

@app.post("/api/optimize-induction")
def optimize_induction(payload: Optional[OptimizeRequest] = None):
    req_trains = payload.required_trains if payload else 15

    # 1. OR-Tools Integer Linear Programming (ILP) Solver
    if ORTOOLS_AVAILABLE:
        solver = pywraplp.Solver.CreateSolver('SCIP')
        if solver:
            # Decision variable: x[i] = 1 if train is inducted, 0 otherwise
            x = {i: solver.IntVar(0, 1, f"train_{train['id']}") for i, train in enumerate(FLEET_DATABASE)}

            # Constraint 1: Induct exactly req_trains
            solver.Add(solver.Sum([x[i] for i in range(len(FLEET_DATABASE))]) == req_trains)

            # Constraint 2: Maintenance blocked trains CANNOT be inducted
            for i, train in enumerate(FLEET_DATABASE):
                if train["is_maintenance_blocked"]:
                    solver.Add(x[i] == 0)

            # Objective: Maximize Branding SLA while Minimizing Mileage
            objective = solver.Objective()
            for i, train in enumerate(FLEET_DATABASE):
                score = (train["branding_sla_hours_needed"] * 100) - (train["mileage_km"] * 0.01)
                objective.SetCoefficient(x[i], score)
            
            objective.SetMaximization()
            solver.Solve()

            processed_fleet = []
            for i, train in enumerate(FLEET_DATABASE):
                is_inducted = bool(x[i].solution_value() > 0.5)
                status = "MAINTENANCE_BLOCKED" if train["is_maintenance_blocked"] else (
                    "INDUCTION_READY" if is_inducted else "STANDBY"
                )
                entry = dict(train)
                entry["displayStatus"] = status
                processed_fleet.append(entry)

            return {
                "source": "OR_TOOLS_SOLVER",
                "total_trains": len(processed_fleet),
                "inducted_count": req_trains,
                "induction_schedule": processed_fleet
            }

    # 2. Heuristic Fallback
    processed_fleet = []
    for train in FLEET_DATABASE:
        i = train["stabling_bay"]
        status = "MAINTENANCE_BLOCKED" if train["is_maintenance_blocked"] else (
            "STANDBY" if i in [2, 7, 12, 17, 22] else "INDUCTION_READY"
        )
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
    audit_entry = payload.dict()
    AUDIT_LOG_STORE.append(audit_entry)

    # Sync state update in FLEET_DATABASE
    for train in FLEET_DATABASE:
        if train["id"] == payload.train_id:
            train["is_maintenance_blocked"] = (payload.new_status == "MAINTENANCE_BLOCKED")

    print(f"[AUDIT LOG RECORDED] Train: {payload.train_id} | Reason: {payload.reason_code}")

    return {
        "status": "SUCCESS",
        "message": f"Dispatch override logged for {payload.train_id}.",
        "audit_record": audit_entry
    }