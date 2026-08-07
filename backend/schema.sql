-- Table Schema for Fleet Allocation Engine
CREATE TABLE IF NOT EXISTS fleet_trains (
    id VARCHAR(10) PRIMARY KEY,
    stabling_bay INT NOT NULL UNIQUE,
    mileage_km INT NOT NULL,
    branding_sla_hours FLOAT NOT NULL,
    is_maintenance_blocked BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data: Complete 25-Train Fleet Initial State
INSERT INTO fleet_trains (id, stabling_bay, mileage_km, branding_sla_hours, is_maintenance_blocked)
VALUES 
    ('TS-01', 1,  14200, 12.5, FALSE),
    ('TS-02', 2,  18900, 0.0,  FALSE),
    ('TS-03', 3,  11000, 5.0,  TRUE),  -- Maintenance Blocked
    ('TS-04', 4,  15100, 18.0, FALSE),
    ('TS-05', 5,  22400, 7.5,  FALSE),
    ('TS-06', 6,  19800, 0.0,  FALSE),
    ('TS-07', 7,  31200, 24.0, FALSE),
    ('TS-08', 8,  27500, 0.0,  TRUE),  -- Maintenance Blocked
    ('TS-09', 9,  16300, 14.0, FALSE),
    ('TS-10', 10, 41000, 32.5, FALSE),
    ('TS-11', 11, 28900, 10.0, FALSE),
    ('TS-12', 12, 13400, 0.0,  FALSE),
    ('TS-13', 13, 35600, 28.0, FALSE),
    ('TS-14', 14, 21100, 3.5,  TRUE),  -- Maintenance Blocked
    ('TS-15', 15, 17800, 15.0, FALSE),
    ('TS-16', 16, 26400, 22.0, FALSE),
    ('TS-17', 17, 38900, 0.0,  FALSE),
    ('TS-18', 18, 12500, 8.0,  FALSE),
    ('TS-19', 19, 44200, 0.0,  TRUE),  -- Maintenance Blocked
    ('TS-20', 20, 20300, 19.5, FALSE),
    ('TS-21', 21, 33100, 11.0, FALSE),
    ('TS-22', 22, 15900, 0.0,  FALSE),
    ('TS-23', 23, 29700, 26.5, FALSE),
    ('TS-24', 24, 37400, 5.5,  FALSE),
    ('TS-25', 25, 18200, 16.0, FALSE)
ON CONFLICT (id) DO UPDATE SET
    stabling_bay = EXCLUDED.stabling_bay,
    mileage_km = EXCLUDED.mileage_km,
    branding_sla_hours = EXCLUDED.branding_sla_hours,
    is_maintenance_blocked = EXCLUDED.is_maintenance_blocked,
    last_updated = CURRENT_TIMESTAMP;
    CREATE TABLE IF NOT EXISTS dispatch_audit_logs (
    id SERIAL PRIMARY KEY,
    train_id VARCHAR(10) NOT NULL,
    stabling_bay INT NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason_code VARCHAR(100) NOT NULL,
    controller_notes TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);