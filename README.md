# Smart Water Scheduler & Predicter

A Machine Learning powered irrigation advisor that helps farmers optimize water usage by combining real-time weather data (`Open-Meteo`) with a pre-trained `GradientBoostingRegressor`.

## 🚀 Key Features

- **Hybrid AI Engine**: Combines Heuristic Logic (FAO-56 Penman-Monteith) with ML Predictions (Scikit-Learn).
- **Real-Time Data**: Live integration with Open-Meteo for hyper-local Weather and Soil Moisture data.
- **Smart Scheduling**: Calculates optimal "Heat Avoidance" irrigation windows (e.g., Early Morning vs Late Evening).
- **Feedback Loop**: Acknowledgment-driven system where user actions recalibrate the confidence model.
- **Containerized**: Built with Docker for "Run Anywhere" simplicity.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Python (FastAPI)
- **Database**: MongoDB (NoSQL)
- **ML**: Scikit-Learn (Gradient Boosting), Joblib
- **Infra**: Docker Compose

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
