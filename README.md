# 🚇 Kochi Metro Fleet Operations & Command Center

An enterprise-grade, real-time fleet operations management and logistics command center built for high-frequency urban transit systems like **Kochi Metro**. 

This system integrates real-time geospatial train tracking, machine learning-driven predictive maintenance forecasting, and automated depot stabling track optimization to maximize rolling stock availability and operational efficiency.

---

## 🌟 Key Features & Operations Modules

### 1. 🗺️ Live Geospatial Track Map (`OpenTrackMap.jsx`)
* **Interactive Fleet Monitoring:** Render live positions of all rolling stock across the rail network using **Leaflet** maps.
* **Real-time Status Overlay:** Instant visual badges for active operational statuses (`INDUCTION_READY`, `STANDBY`, `MAINTENANCE_BLOCKED`).
* **Cross-Module Deep Selection:** Clicking a train on the geospatial map seamlessly focuses and highlights that specific train across all operational dashboards.

### 2. 🤖 ML Predictive Maintenance & Health Forecasting (`PredictiveMaintenancePanel.jsx`)
* **Multi-Variable Risk Regression:** Dynamic failure risk index calculated using real-time sensor telemetry:
  * **Brake Wear Percentage (%)**
  * **Traction Motor Temperatures (°C)**
  * **HVAC Compressor Operating Hours**
  * **Accumulated Wheelset Mileage (km)**
* **Remaining Useful Life (RUL):** Real-time automated calculation of remaining operational hours before mandatory servicing.
* **Priority Defect Alerts:** Automated flagging of high-risk assets (`CRITICAL`, `MODERATE`, `OPTIMAL`) to eliminate unexpected track breakdowns.

### 3. ⚡ Automated Stabling Bay & Dispatch Optimizer (`DepotOptimizerPanel.jsx`)
* **Depot Track Allocation Heuristic:** Algorithmic pairing of 25 fleet units across depot tracks based on maintenance pit availability, dispatch SLA priorities, and branding hours.
* **Shunting Minimization Engine:** Calculates necessary track moves to minimize depot congestion and power consumption.
* **Bottleneck Warnings:** Live system alerts for track capacity limits and forced non-optimal bay overrides.

---

## 🏗️ System Architecture

```text
                               ┌──────────────────────────────┐
                               │           App.jsx            │
                               │   (Central Fleet State)      │
                               └──────────────┬───────────────┘
                                              │
                   ┌──────────────────────────┼──────────────────────────┐
                   ▼                          ▼                          ▼
     ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
     │   OpenTrackMap (Map)     │ │ ML Predictive Analytics  │ │ Depot Stabling Optimizer │
     │  Geospatial GPS Display  │ │  Regression & RUL Engine │ │ Track Allocation Engine │
     └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
