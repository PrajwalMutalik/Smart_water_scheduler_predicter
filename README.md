# Smart Irrigation System - Technical Architecture
<img width="1918" height="958" alt="image" src="https://github.com/user-attachments/assets/2d74cad7-975e-4b05-aff4-e5d965456667" />
<img width="1918" height="958" alt="image" src="https://github.com/user-attachments/assets/5ca3b2ca-2480-465a-8e33-2084a6ae3b58" />
<img width="1918" height="958" alt="image" src="https://github.com/user-attachments/assets/e14a8545-981b-4ea6-97d1-a319de7087e2" />
<img width="1918" height="958" alt="image" src="https://github.com/user-attachments/assets/b5a8cdfc-90b6-4c01-ac3a-1e5e5fcd8ff9" />
<img width="1918" height="958" alt="image" src="https://github.com/user-attachments/assets/0a207d02-ca3e-40e5-91bc-a59199c9add7" />




## 1. Project Workflow Overview
The system operates on an **Acknowledgment-Driven Loop**. It does not automate irrigation blindly; instead, it acts as an intelligent advisor that learns from farmer actions.

### The Loop:
* **Data Ingestion:** System fetches Live Weather + Soil Data + Farm Config.
* **Hybrid Analysis:** Data is passed through both an **ML Model** (Gradient Boosting) and a **Heuristic Formula**.
* **Recommendation:** System outputs `IRRIGATE`, `MONITOR`, or `SKIP` with a specific volume and schedule.
* **Farmer Decision:** User checks the dashboard and clicks **"Mark as Completed"** (Confirm) or **"Skip Today"** (Reject).
* **Learning:** This action is saved to the `History` ledger, which implicitly validates (or invalidates) the model's confidence for future calibration.

---

## 2. Machine Learning Engine (Gradient Boosting)
The core intelligence is located in `app/services/prediction_models.py` and `irrigation_pipeline.py`.

### A. The Model Integrity
* **Model File:** `app/ml/saved_models/irrigation_model.pkl`
* **Type:** Gradient Boosting Regressor (sklearn).
* **Role:** Predicts exact water demand (mm) based on historical patterns.
* **Input Features:**
    * **CROP TYPE:** Categorical (e.g., 'WHEAT', 'RICE').
    * **SOIL TYPE:** Condition-based (mapped from live moisture to 'DRY', 'HUMID', 'WET').
    * **REGION:** Geographic context (e.g., 'SEMI ARID').
    * **TEMPERATURE:** Binned values (e.g., '20-30' °C).
    * **WEATHER CONDITION:** Aggregate metric (e.g., 'SUNNY', 'RAINY').

### B. The Hybrid Pipeline (`irrigation_pipeline.py`)
To ensure safety and robust start-up, we don't rely 100% on the black-box model.

1.  **Step 1:** Calculate **Heuristic Demand** (Base ET formula).
2.  **Step 2:** Calculate **ML Prediction** (Model Output).
3.  **Step 3 - Blending:** `Final Demand = (Heuristic * 0.3) + (ML * 0.7)`. This gives the ML model majority control (70%) while keeping a sanity anchor.
4.  **Step 4 - Fine Tuning:** Adjusts final value based on **Real-Time Soil Moisture** (from Open-Meteo API).

---

## 3. API Structure & Management
The backend is built on **FastAPI** (`app/main.py`), running in a Docker container.

### A. Key Endpoints

| Endpoint | Method | Function |
| :--- | :--- | :--- |
| `/farms/{id}/advice` | `GET` | **The Brain.** Triggers `run_irrigation_pipeline`. Fetches weather, runs ML, returns JSON advice. |
| `/farms/summary` | `GET` | **The Dashboard.** Aggregates status of all farms for the main view. |
| `/audit/ack` | `POST` | **The Feedback.** Receives `DONE` or `SKIPPED` events. Updates the database and triggers re-calculation logic. |
| `/farms` | `POST` | **Management.** Creates new farm profiles. |

### B. External Data (`external_api.py`)
* **Provider:** Open-Meteo (Free, No Key).
* **Reliability:** Implements a **Fallback Circuit Breaker**.
    * If the API times out or fails, the system returns a "Safe Default Profile" (25°C, Loam Soil) to prevent "System Offline" errors.
    * Data is flagged as `weather_approx` so the UI can warn the user (Confidence: LOW).

---

## 4. Frontend Integration
* **Stack:** React + Tailwind CSS.
* **State Management:** Real-time fetching via **Axios** on component mount.
* **Visualization:**
    * `FarmDetail.jsx`: Parses the API response.
    * **Smart Schedule:** Uses the `start_time` and `end_time` calculated by the backend to show optimized windows (e.g., "06:00 AM - 08:30 AM") to avoid peak heat.

---

## 5. Database Schema (MongoDB)
The system uses a NoSQL document store (MongoDB) for flexibility.

### A. Collections

**`farms`** (Stores profile and state)
* `_id`: ObjectId
* `name`, `crop`, `soil_type`, `region`
* `location`: `{ lat, lon }`
* `system_confidence_score`: Float (0.0 - 1.0) - *The "Trust" metric.*
* `calibration_status`: String ('Initializing', 'Improving', 'Stable')
* `total_events`: Int (Learning counter)

**`history`** (The Ledger of Truth / Audit Log)
* `farm_id`: Ref -> `farms`
* `date`: ISO Date
* `action`: 'IRRIGATE', 'SKIP', 'MONITOR'
* `feedback`: 'DONE', 'SKIPPED' (User Action)
* `volume_liters`: Amount applied
* `source`: 'System' or 'User'

---

## 6. Infrastructure (Docker)
The entire system is containerized for "One-Click Deploy".

* `docker-compose.yml`: Orchestrator.
* **Service 1:** `backend`: Python/FastAPI (Port 8000).
* **Service 2:** `frontend`: Node/React (Port 5173).
* **Service 3:** `mongo`: Database (Port 27017).
* **Networking:** All services communicate on the `app-network` bridge.

---

## 7. Security & Configuration
* **`.env` File:** Stores sensitive keys (never committed to Git).
    * `MONGO_URI`: Database connection string.
    * `SECRET_KEY`: (Reserved for future Auth).
* **CORS:** Configured in `app/main.py` to allow frontend communication.

---

## 8. Future Roadmap
### Phase 2: Automation & Hardware
* **IoT Integration:** Replace Open-Meteo "Estimated" soil data with real **ESP32 Soil Moisture Sensors** reporting to MQTT.
* **Automated Retraining:** Create a pipeline (`train_model.py`) that runs weekly, fetching the `history` collection to re-train the XGBoost model on **actual** farmer preferences, creating a personalized model per farm.
* **Valve Control:** Connect the backend to Solenoid Valves for "One-Click Execution" (currently manual).
---

## 🏃‍♂️ How to Run

### Prerequisites

1.  **Git**: [Download](https://git-scm.com/downloads)
2.  **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop/) (Windows/Mac) OR **Docker Engine** (Linux)

### Windows Users 🪟

- Install **Docker Desktop for Windows**.
- **Recommended**: Go to Docker Settings -> General -> Check "Use the WSL 2 based engine".
- Open **PowerShell** (Run as Administrator) or **Git Bash**.

### Installation Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/PrajwalMutalik/Smart_water_scheduler_predicter.git
    cd Smart_water_scheduler_predicter
    ```

2.  **Configuration**

    - Create a `.env` file in the root folder (same level as `docker-compose.yml`).
    - Add the following line:

    ```env
    MONGO_URI=mongodb://mongo:27017/irrigation_db
    ```

3.  **Run the System**

    ```bash
    docker-compose up --build
    ```

    - _First time run may take a few minutes to build the images._

4.  **Access the App**
    - **Farmer Dashboard**: [http://localhost:5173](http://localhost:5173)
    - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ❓ Troubleshooting

- **"Docker is not running"**: Open Docker Desktop application and wait for the whale icon to stabilize.
- **"Port already in use"**: Ensure no other service is using ports `5173`, `8000`, or `27017`.
- **"System Offline" in Dashboard**: Check internet connection (required for Open-Meteo API). The system has a fallback mode but live data is preferred.

