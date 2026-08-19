# 🌊 HydroGrid AI

### Intelligent Flood Simulation, Infrastructure Monitoring & Emergency Route Intelligence

HydroGrid AI is a simulation-based intelligent flood management platform designed to analyze changing rainfall conditions, simulate flood progression, monitor infrastructure risk, model stormwater routing, and evaluate safer emergency routes under simulated flood conditions.

The platform brings these capabilities together into a centralized **Command Center**, providing an interactive environment for exploring how flooding can affect urban infrastructure, network accessibility, and emergency response.

> **⚠️ Prototype Notice:** HydroGrid AI is currently a research and functional prototype. Environmental conditions, infrastructure states, and route conditions may be simulated and should not be treated as real-time emergency or navigation information.

---

## 🚀 Key Features

* 🌧️ Configurable rainfall and flood simulation
* 💧 Simulated water-level progression
* 🏗️ Infrastructure and vault/network monitoring
* ⚠️ Flood-risk analysis and visualization
* 🗺️ Interactive city and network visualization
* 🔄 Stormwater routing and diversion simulation
* 🚑 Flood-aware emergency route analysis
* 🛣️ Route safety and travel-time comparison
* 🔁 Dynamic route recalculation as flood conditions change
* 📊 Centralized command-center dashboard
* 📡 Simulated sensor and infrastructure telemetry
* 🛡️ Fail-safe and critical-state monitoring

---

## 🧠 How It Works

```text
User Inputs
     ↓
Rainfall & Flood Simulation
     ↓
Water-Level Progression
     ↓
Infrastructure / Vault Monitoring
     ↓
Flood-Risk Analysis
     ↓
 ┌─────────────────┬──────────────────┐
 ↓                 ↓
Water Routing   Emergency Route Analysis
 └─────────────────┬──────────────────┘
                   ↓
        Recommended Insights
                   ↓
        HydroGrid AI Command Center
```

Users can configure simulation parameters such as rainfall intensity, duration, water-level growth, flood thresholds, and traffic conditions where supported.

The system then evaluates the simulated flood state and its impact on infrastructure and route accessibility.

---

## 🚑 Emergency Route Intelligence

Unlike traditional navigation systems that focus primarily on the shortest route, HydroGrid AI follows a **safety-first routing approach**.

The system can evaluate candidate routes based on:

* Flood risk
* Route accessibility
* Blocked or affected segments
* Route safety
* Estimated travel time
* Selected routing strategy

Available strategies may include:

* **Safest Route** — prioritizes minimum flood exposure
* **Balanced Route** — balances safety and travel time
* **Fastest Safe Route** — selects the fastest route that meets the safety threshold
* **Ambulance Mode** — prioritizes safe accessibility to an emergency destination

The objective is to identify the **safest practical route under the current simulated flood conditions**.

---

## 🖥️ System Modules

| Module               | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| **Command Center**   | Central dashboard for monitoring simulations and system conditions |
| **City Map**         | Visualizes the simulated urban and infrastructure network          |
| **Vault Network**    | Monitors connected infrastructure and water-storage nodes          |
| **Flood Risk AI**    | Analyzes and visualizes simulated flood-risk conditions            |
| **Water Routing**    | Demonstrates water movement and diversion through the network      |
| **Emergency Routes** | Evaluates safer route alternatives during simulated flooding       |
| **Sensor Stream**    | Displays simulated environmental and infrastructure telemetry      |
| **Fail-Safe**        | Represents critical and emergency operating conditions             |
| **Evaluation**       | Provides system and model evaluation information                   |

---

## 🛠️ Technology Stack

* **Frontend:** React
* **Languages:** TypeScript / JavaScript
* **UI:** HTML5, CSS, Tailwind CSS
* **Visualization:** Interactive maps, network visualization, and data visualization
* **Development:** Bolt.new, Git, GitHub, GitHub Codespaces

> The exact dependencies and libraries used in the project are available in `package.json`.

---

## 📂 Project Structure

```text
HydroGrid-AI/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── data/
│   ├── simulation/
│   └── routing/
│
├── public/
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git

### Installation

```bash
git clone <repository-url>
```

```bash
cd <project-directory>
```

```bash
npm install
```

### Run the Application

```bash
npm run dev
```

Open the local URL provided by the development server.

---

## 🧪 Typical Workflow

1. Open the **HydroGrid AI Command Center**
2. Configure rainfall and simulation parameters
3. Start the flood simulation
4. Monitor water levels and infrastructure conditions
5. Analyze flood-risk areas
6. Observe water-routing behavior
7. Open the **Emergency Routes** module
8. Select an origin, destination, and routing strategy
9. Compare candidate routes based on safety and travel conditions
10. Observe the recommended route
11. Modify flood conditions and analyze how the system responds

---

## 🔮 Future Enhancements

Future development of HydroGrid AI can include:

* 🌦️ Real-time weather and rainfall APIs
* 📡 IoT-based water-level sensors
* 🗺️ GIS-based road and flood mapping
* 🚦 Live traffic and road-condition data
* 🤖 Machine-learning-based flood prediction
* 📈 Time-series and adaptive risk models
* 🚑 Emergency-service and hospital integration
* ☁️ Cloud and edge deployment
* 📱 Mobile application support
* 🌍 Multi-city scalability

---

## ⚠️ Current Limitations

HydroGrid AI is currently a **simulation and research prototype**.

* Flood and environmental conditions may be simulated.
* Route results are not intended for real-world emergency navigation.
* Travel times and traffic conditions may be estimated.
* The system does not replace official flood-warning or emergency-response services.
* Real-world deployment would require validated hydrological models, GIS data, live environmental sensors, traffic information, and emergency-service integration.

---

## 📌 Project Status

**Current Status:** 🚧 Research / Functional Prototype

### Currently Implemented

* Flood simulation
* Rainfall parameter control
* Infrastructure and vault monitoring
* Flood-risk visualization
* City/network visualization
* Water-routing simulation
* Emergency-route analysis
* Command-center dashboard
* Sensor visualization
* Fail-safe representation

### In Development / Future Scope

* Real-time environmental data integration
* Live traffic and road-condition data
* GIS integration
* Advanced AI/ML flood prediction
* Emergency-service integration
* Production-grade deployment

---

## 🎯 Research Value

HydroGrid AI brings together:

```text
Flood Simulation
        +
Infrastructure Monitoring
        +
Flood Risk Analysis
        +
Water Routing
        +
Emergency Route Intelligence
        =
Integrated Flood Decision-Support Platform
```

The project provides a foundation for future research and development in:

* AI-based flood prediction
* Smart-city infrastructure
* Disaster-response systems
* Flood-aware navigation
* Intelligent water management
* Infrastructure digital twins
* Emergency decision-support systems

---

## 📄 Disclaimer

HydroGrid AI is intended for **research, educational demonstration, and decision-support experimentation**.

It should not be used as a replacement for official emergency services, live flood-warning systems, emergency dispatch systems, or real-time navigation platforms.

---

### 🌊 HydroGrid AI

**From Flood Prediction to Intelligent Response.**

