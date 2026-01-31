# Hybrid AI & Physics Engine Design Document
**Project**: ForHumanAI (Sensorless Smart Farm)
**Architecture**: Physics-Informed AI (Soft-Sensor Technology)

## 1. Overview
This system aims to achieve **>90% accuracy** in environmental monitoring and decision-making **without physical sensors**. It uses a hybrid approach combining deterministic physical models with probabilistic Large Language Models (LLMs).

## 2. Core Architecture: The "Tri-Layer" System

### Layer 1: The Physics Engine (Deterministic)
*   **Role**: The "Ground Truth" Generator.
*   **Technology**: Python (Numpy/Pandas).
*   **Input**:
    *   External Weather (Open-Meteo API): Temp, Humidity, Solar Radiation, Wind.
    *   Facility Parameters (User Profile): Greenhouse type (Vinyl/Glass), Dimensions, Insulation capability.
    *   Time: Day/Night cycle, Season.
*   **Output**:
    *   `estimated_internal_temp`: Calculated based on heat transfer & greenhouse effect equations.
    *   `estimated_internal_humidity`: Calculated based on external humidity & estimated transpiration.
    *   `VPD (Vapor Pressure Deficit)`: Calculated metabolic indicator.
    *   `hard_safety_limits`: Minimal/Maximal safe thresholds for the specific crop.

### Layer 2: The Intelligence Engine (Probabilistic)
*   **Role**: The "Agronomist" (Reasoning & Diagnosis).
*   **Model**: Claude 3.5 Sonnet (Primary) / Gemini 1.5 Pro (Secondary/Vision).
*   **Input**:
    *   Outputs from Layer 1 (Physics Estimates).
    *   Visual Data (User Photos).
    *   Qualitative User Inputs (e.g., "Leaves look droopy").
*   **Logic**:
    *   Receives the physics context: "Physics engine says internal temp is likely 28°C."
    *   Analyzes photo: "Visual check confirms heat stress symptoms."
    *   Synthesizes: "Confidence is High. Recommendation: Open side vents."

### Layer 3: The Safety & Control Guard (Rule-Based)
*   **Role**: The "Brake System".
*   **Logic**:
    *   **Conflict Resolution**: If AI suggests action that violates Layer 1's safety limits, **BLOCK** and ask user.
    *   **Uncertainty Handling**: If AI Confidence < 80%, trigger **Active Learning Question** (e.g., "Please touch the soil, is it dry?").

## 3. Implementation Roadmap

### Phase 1: Virtual Sensor Implementation (Current)
1.  **`physics_engine.py`**: Implement thermal dynamics models for greenhouses.
2.  **`service_manager.py`**: Orchestrate data flow (Weather -> Physics -> AI).
3.  **API Integration**: Replace current direct AI calls with the Hybrid pipeline.

### Phase 2: Calibration Loop
1.  **Feedback UI**: Minimize user friction for providing "Ground Truth" (e.g., "Was this helpful?" buttons).
2.  **Parameter Tuning**: Allow the Physics Engine to adjust `insulation_factor` based on user feedback.

## 4. Key Algorithms (Simplified)

### Internal Temperature Estimation
$$ T_{internal} = T_{external} + (SolarRad \times K_{greenhouse}) - (Wind \times K_{ventilation}) $$

### Confidence Score Calculation
$$ Score = (W_1 \times Consistency_{Physics}) + (W_2 \times Clarity_{Vision}) + (W_3 \times UserFeedback) $$

---
**Status**: Design Phase Complete. Moving to Implementation.
