import sys
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st


# ============================================================
# 1. PROJECT PATH CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Streamlit çalışırken proje modüllerinin bulunmasını sağlar.
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from detection.sensor_ml.predict import RoadGuardianSensorPredictor
from detection.camera_ml.predict import RoadGuardianCameraPredictor

from detection.fusion.risk_fusion import (
    fuse_predictions,
    save_fusion_result,
)

from shared.event_schema import (
    create_event_id,
    create_prediction_event,
)


# ============================================================
# 2. STREAMLIT PAGE CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="RoadGuardian | Integrated MVP",
    page_icon="🚘",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ============================================================
# 3. APPLICATION STYLE
# ============================================================

st.markdown(
    """
    <style>

    .block-container {
        padding-top: 1.5rem;
        padding-bottom: 2rem;
        max-width: 1450px;
    }

    .risk-warning {
        background-color: #8B1E1E;
        color: white;
        padding: 28px;
        border-radius: 14px;
        text-align: center;
        font-size: 27px;
        font-weight: bold;
        margin-top: 15px;
        margin-bottom: 15px;
    }

    .risk-success {
        background-color: #174A35;
        color: white;
        padding: 28px;
        border-radius: 14px;
        text-align: center;
        font-size: 25px;
        font-weight: bold;
        margin-top: 15px;
        margin-bottom: 15px;
    }

    .fusion-box {
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #718096;
        text-align: center;
        margin-bottom: 15px;
    }

    </style>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# 4. SCENARIO CONFIGURATION
# ============================================================

BATCH_ID = "20261025T191347_968589Z_adad93"

CONTACT_BATCH_DIR = (
    PROJECT_ROOT
    / "detection"
    / "simulation"
    / "outputs"
    / "contact_batches"
    / BATCH_ID
)

FEATURES_CSV = (
    PROJECT_ROOT
    / "detection"
    / "simulation"
    / "outputs"
    / "sensor_ml"
    / BATCH_ID
    / "features.csv"
)

CAMERA_IMAGE = (
    PROJECT_ROOT
    / "detection"
    / "camera_ml"
    / "test_images"
    / "pothole.webp"
)


# ============================================================
# 5. SIDEBAR - DRIVING SCENARIO SELECTION
# ============================================================

st.sidebar.title("🚘 RoadGuardian")

st.sidebar.markdown(
    "### Driving Scenario Configuration"
)

st.sidebar.divider()

selected_road_type = st.sidebar.selectbox(
    "Road Condition",
    options=["pothole"],
    format_func=lambda road: {
        "pothole": "Pothole"
    }[road],
)

selected_speed = st.sidebar.selectbox(
    "Vehicle Speed",
    options=[30, 50, 70],
    index=0,
    format_func=lambda speed: f"{speed} km/h",
)

selected_variant = st.sidebar.selectbox(
    "Simulation Profile",
    options=[1, 2, 3],
    index=0,
    format_func=lambda variant: f"Variant {variant}",
)

SCENARIO_ID = (
    f"{selected_road_type}_"
    f"{selected_speed}kmh_"
    f"v{selected_variant}"
)

SENSOR_CSV = (
    CONTACT_BATCH_DIR
    / f"{SCENARIO_ID}.csv"
)

st.sidebar.divider()

st.sidebar.markdown("### Selected Scenario")

st.sidebar.write(f"**Road Type:** {selected_road_type}")
st.sidebar.write(f"**Speed:** {selected_speed} km/h")
st.sidebar.write(f"**Profile:** v{selected_variant}")

st.sidebar.caption(
    "All sensor signals are generated using "
    "the Quarter-Car numerical simulation."
)

st.sidebar.info(
    "Demo Mode: Synthetic sensor data "
    "+ independently captured road image."
)


# ============================================================
# 6. DATA AND MODEL LOADING
# ============================================================

@st.cache_data
def load_sensor_signals(file_path):
    return pd.read_csv(file_path)


@st.cache_data
def load_features(file_path):
    return pd.read_csv(file_path)


@st.cache_resource
def load_models():

    sensor_model = RoadGuardianSensorPredictor()

    camera_model = RoadGuardianCameraPredictor()

    return sensor_model, camera_model


# ============================================================
# 7. CHART FUNCTION
# ============================================================

def create_signal_chart(
    df,
    column,
    title,
    y_axis,
    color="#00A8E8",
):

    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["time_s"],
            y=df[column],
            mode="lines",
            name=title,
            line=dict(
                color=color,
                width=2.5,
            ),
            hovertemplate=(
                "Time: %{x:.3f} s"
                "<br>Value: %{y:.4f}"
                "<extra></extra>"
            ),
        )
    )

    fig.update_layout(
        title=title,
        xaxis_title="Time (s)",
        yaxis_title=y_axis,
        height=260,
        margin=dict(
            l=20,
            r=20,
            t=45,
            b=20,
        ),
        hovermode="x unified",
    )

    return fig


# ============================================================
# 8. DRIVER ADVISORY ENGINE - DEMO RULES
# ============================================================

def generate_driver_advisory(
    fusion_result,
    vehicle_speed,
):

    warning = fusion_result["warning"]
    road_type = fusion_result["road_type"]
    fusion_status = fusion_result["fusion_status"]

    # No risk detected
    if not warning:

        return {
            "level": "none",
            "title": "No Active Road Hazard Warning",
            "message": (
                "The current model outputs did not "
                "trigger a road hazard warning."
            ),
        }

    # Conflicting model predictions
    if fusion_status == "conflict":

        return {
            "level": "caution",
            "title": "Possible Road Hazard",
            "message": (
                "The detection models produced "
                "different road hazard predictions. "
                "Proceed carefully."
            ),
        }

    # Pothole advisory
    if road_type == "pothole":

        if vehicle_speed == 30:

            return {
                "level": "caution",
                "title": "Pothole Risk Detected",
                "message": (
                    "Potential pothole ahead. "
                    "Maintain awareness and proceed carefully."
                ),
            }

        elif vehicle_speed == 50:

            return {
                "level": "caution",
                "title": "Pothole Risk Detected",
                "message": (
                    "Potential pothole ahead. "
                    "Consider reducing speed gradually "
                    "if road conditions allow."
                ),
            }

        else:

            return {
                "level": "high",
                "title": "Pothole Risk Detected",
                "message": (
                    "Potential pothole ahead. "
                    "Exercise caution and reduce speed "
                    "gradually if safe. "
                    "Avoid sudden braking or steering."
                ),
            }

    # Speed bump advisory
    if road_type == "speed_bump":

        return {
            "level": "caution",
            "title": "Speed Bump Risk Detected",
            "message": (
                "Potential speed bump ahead. "
                "Adjust speed smoothly when safe."
            ),
        }

    # Other or unknown road hazard
    return {
        "level": "caution",
        "title": "Possible Road Hazard",
        "message": (
            "A possible road hazard was detected. "
            "Proceed carefully."
        ),
    }


# ============================================================
# 9. APPLICATION HEADER
# ============================================================

st.title("🚘 ROADGUARDIAN")

st.subheader(
    "Intelligent Road Hazard Detection"
)

st.caption(
    "Integrated MVP | Numerical Simulation "
    "+ Camera Intelligence + Risk Fusion"
)

st.divider()


# ============================================================
# 10. SELECTED SCENARIO INFORMATION
# ============================================================

st.header("1. Driving Scenario")

c1, c2, c3, c4 = st.columns(4)

c1.metric(
    "Road Condition",
    selected_road_type.upper(),
)

c2.metric(
    "Vehicle Speed",
    f"{selected_speed} km/h",
)

c3.metric(
    "Simulation Profile",
    f"Variant {selected_variant}",
)

c4.metric(
    "Data Source",
    "SYNTHETIC",
)

st.info(
    f"Selected Scenario: A vehicle travelling at "
    f"{selected_speed} km/h encounters a simulated pothole. "
    f"Profile variant: {selected_variant}."
)


# ============================================================
# 11. INPUT FILE VALIDATION
# ============================================================

required_files = [
    SENSOR_CSV,
    FEATURES_CSV,
    CAMERA_IMAGE,
]

missing_files = [
    str(path)
    for path in required_files
    if not path.exists()
]

if missing_files:

    st.error(
        "Some files required for the selected "
        "scenario could not be found."
    )

    st.code("\n".join(missing_files))

    st.stop()


# ============================================================
# 12. LOAD SCENARIO DATA
# ============================================================

signals = load_sensor_signals(
    str(SENSOR_CSV)
)

features = load_features(
    str(FEATURES_CSV)
)

feature_rows = features[
    features["scenario_id"] == SCENARIO_ID
]

if feature_rows.empty:

    st.error(
        f"Scenario {SCENARIO_ID} "
        "was not found in features.csv."
    )

    st.stop()


# ============================================================
# 13. CALCULATE PHYSICAL METRICS
# ============================================================

peak_body_acc = (
    signals["vertical_accel_ms2"]
    .abs()
    .max()
)

peak_wheel_acc = (
    signals["vertical_wheel_accel_ms2"]
    .abs()
    .max()
)

max_suspension_travel_cm = (
    signals["suspension_travel_m"]
    .abs()
    .max()
    * 100
)

rms_body_acc = (
    (
        signals["vertical_accel_ms2"] ** 2
    ).mean() ** 0.5
)


# ============================================================
# 14. PHYSICAL RESPONSE METRICS
# ============================================================

st.header("2. Vehicle Physical Response")

st.write(
    "The following measurements are calculated "
    "from the selected Quarter-Car simulation."
)

m1, m2, m3, m4 = st.columns(4)

m1.metric(
    "Peak Body Acceleration",
    f"{peak_body_acc:.2f} m/s²",
)

m2.metric(
    "Peak Wheel Acceleration",
    f"{peak_wheel_acc:.2f} m/s²",
)

m3.metric(
    "Peak Suspension Travel",
    f"{max_suspension_travel_cm:.2f} cm",
)

m4.metric(
    "RMS Body Acceleration",
    f"{rms_body_acc:.2f} m/s²",
)

st.caption(
    "These are simulated physical measurements, "
    "not real vehicle telemetry."
)

st.divider()


# ============================================================
# 15. SENSOR AND CAMERA VISUALIZATION
# ============================================================

st.header("3. RoadGuardian Detection Inputs")

sensor_col, camera_col = st.columns(
    [1.3, 1],
    gap="large",
)


# ------------------------------
# SENSOR SIDE
# ------------------------------

with sensor_col:

    st.subheader(
        "📊 Numerical Sensor Simulation"
    )

    st.plotly_chart(
        create_signal_chart(
            signals,
            "road_displacement_m",
            "Simulated Road Profile",
            "Displacement (m)",
            "#0077B6",
        ),
        use_container_width=True,
    )

    st.plotly_chart(
        create_signal_chart(
            signals,
            "vertical_accel_ms2",
            "Vehicle Body Acceleration",
            "Acceleration (m/s²)",
            "#E76F51",
        ),
        use_container_width=True,
    )

    st.plotly_chart(
        create_signal_chart(
            signals,
            "vertical_wheel_accel_ms2",
            "Wheel Acceleration",
            "Acceleration (m/s²)",
            "#2A9D8F",
        ),
        use_container_width=True,
    )

    st.plotly_chart(
        create_signal_chart(
            signals,
            "suspension_travel_m",
            "Suspension Travel",
            "Travel (m)",
            "#9B5DE5",
        ),
        use_container_width=True,
    )

    st.caption(
        f"Quarter-Car Model | "
        f"Scenario: {SCENARIO_ID}"
    )


# ------------------------------
# CAMERA SIDE
# ------------------------------

with camera_col:

    st.subheader(
        "📷 Camera-Based Road Analysis"
    )

    st.image(
        str(CAMERA_IMAGE),
        caption="Road Image - Pothole Scenario",
        use_container_width=True,
    )

    st.markdown("### Camera Model")

    st.write("**Architecture:** MobileNetV2")

    st.write(
        "**Classification:** Normal Road / Pothole"
    )

    st.write(
        "**Input Resolution:** 224 × 224"
    )

    st.info(
        "The camera model analyzes the road image "
        "independently of the numerical simulation."
    )

    st.markdown("### Sensor Model")

    st.write("**Algorithm:** Random Forest")

    st.write(
        "**Input:** 24 numerical sensor features"
    )

    st.write(
        "**Classes:** Normal / Pothole / Speed Bump"
    )


# ============================================================
# 16. RUN DETECTION
# ============================================================

st.divider()

st.header("4. Run Integrated Detection")

st.write(
    "Run both machine learning models "
    "and combine their predictions "
    "using the RoadGuardian Risk Fusion Engine."
)

run_detection = st.button(
    "▶ RUN ROADGUARDIAN DETECTION",
    type="primary",
    use_container_width=True,
)


if run_detection:

    try:

        with st.spinner(
            "Running sensor and camera models..."
        ):

            # ------------------------------------------
            # SENSOR MODEL
            # ------------------------------------------

            (
                sensor_predictor,
                camera_predictor,
            ) = load_models()

            feature_row = (
                feature_rows
                .iloc[0]
                .to_dict()
            )

            sensor_result = (
                sensor_predictor.predict(
                    feature_row
                )
            )

            # ------------------------------------------
            # CAMERA MODEL
            # ------------------------------------------

            camera_result = (
                camera_predictor.predict(
                    CAMERA_IMAGE
                )
            )

            # ------------------------------------------
            # CREATE SHARED EVENT
            # ------------------------------------------

            event_id = create_event_id()

            sensor_event = create_prediction_event(
                source="sensor",
                road_type=sensor_result["road_type"],
                confidence=sensor_result["confidence"],
                event_id=event_id,
                metadata={
                    "scenario_id": SCENARIO_ID,
                    "vehicle_speed_kmh": selected_speed,
                    "data_source": "synthetic_training_demo",
                },
            )

            camera_event = create_prediction_event(
                source="camera",
                road_type=camera_result["road_type"],
                confidence=camera_result["confidence"],
                event_id=event_id,
                metadata={
                    "image_path": str(CAMERA_IMAGE),
                    "model": "MobileNetV2",
                    "data_source": "independent_camera_image",
                },
            )

            # ------------------------------------------
            # RISK FUSION
            # ------------------------------------------

            fusion_result = fuse_predictions(
                sensor_event,
                camera_event,
            )

            # This is a paired-input integration demo.
            fusion_result["validation_level"] = (
                "paired_demo_inputs"
            )

            # ------------------------------------------
            # DRIVER ADVISORY
            # ------------------------------------------

            advisory_result = (
                generate_driver_advisory(
                    fusion_result,
                    selected_speed,
                )
            )

            # ------------------------------------------
            # SAVE FUSION RESULT
            # ------------------------------------------

            saved_path = save_fusion_result(
                fusion_result
            )

            # ------------------------------------------
            # SAVE RESULTS TO SESSION STATE
            # ------------------------------------------

            st.session_state["demo_result"] = {
                "scenario_id": SCENARIO_ID,
                "speed": selected_speed,
                "sensor": sensor_result,
                "camera": camera_result,
                "fusion": fusion_result,
                "advisory": advisory_result,
                "saved_path": str(saved_path),
            }

    except Exception as error:

        st.error(
            "An error occurred during detection."
        )

        st.exception(error)


# ============================================================
# 17. DISPLAY MODEL RESULTS
# ============================================================

result_is_current = (
    "demo_result" in st.session_state
    and
    st.session_state["demo_result"]["scenario_id"]
    == SCENARIO_ID
)

if result_is_current:

    result = st.session_state["demo_result"]

    sensor_result = result["sensor"]

    camera_result = result["camera"]

    fusion_result = result["fusion"]

    advisory_result = result["advisory"]

    st.divider()

    st.header("5. Machine Learning Predictions")

    left, right = st.columns(
        2,
        gap="large",
    )

    # ------------------------------------------
    # SENSOR PREDICTION
    # ------------------------------------------

    with left:

        st.subheader(
            "📊 Sensor Intelligence"
        )

        st.metric(
            "Predicted Road Type",
            sensor_result["road_type"].upper(),
        )

        st.metric(
            "Model Score",
            (
                f"{sensor_result['confidence'] * 100:.2f}%"
            ),
        )

        st.caption(
            "Random Forest | "
            "Synthetic Quarter-Car Data"
        )

    # ------------------------------------------
    # CAMERA PREDICTION
    # ------------------------------------------

    with right:

        st.subheader(
            "📷 Camera Intelligence"
        )

        st.metric(
            "Predicted Road Type",
            camera_result["road_type"].upper(),
        )

        st.metric(
            "Model Score",
            (
                f"{camera_result['confidence'] * 100:.2f}%"
            ),
        )

        st.caption(
            "MobileNetV2 | Independent Road Image"
        )

    st.caption(
        "Model scores represent class prediction "
        "scores for these inputs, not independently "
        "validated real-world detection accuracy."
    )

    st.divider()


    # ========================================================
    # 18. RISK FUSION RESULT
    # ========================================================

    st.header("6. RoadGuardian Risk Fusion")

    fusion_status = fusion_result[
        "fusion_status"
    ]

    st.markdown(
        f"""
        <div class="fusion-box">
            <h3>RISK FUSION ENGINE</h3>
            <p>Decision: {fusion_status.upper()}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if fusion_result["warning"]:

        if fusion_result["road_type"] == "pothole":

            driver_warning = (
                "⚠️ POTHOLE RISK DETECTED"
            )

        elif fusion_result["road_type"] == "speed_bump":

            driver_warning = (
                "⚠️ SPEED BUMP RISK DETECTED"
            )

        else:

            driver_warning = (
                "⚠️ POSSIBLE ROAD HAZARD"
            )

        st.markdown(
            f"""
            <div class="risk-warning">
                {driver_warning}
            </div>
            """,
            unsafe_allow_html=True,
        )

    else:

        st.markdown(
            """
            <div class="risk-success">
                NO ROAD HAZARD WARNING
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.write(
        "**Fusion Status:**",
        fusion_status,
    )

    st.write(
        "**Technical Message:**",
        fusion_result["warning_message"],
    )

    st.divider()


    # ========================================================
    # 19. DRIVER ADVISORY
    # ========================================================

    st.header("7. Driver Advisory")

    st.subheader(
        advisory_result["title"]
    )

    advisory_level = advisory_result["level"]

    if advisory_level == "high":

        st.error(
            advisory_result["message"]
        )

    elif advisory_level == "caution":

        st.warning(
            advisory_result["message"]
        )

    else:

        st.info(
            advisory_result["message"]
        )

    st.caption(
        f"Selected vehicle speed: "
        f"{result['speed']} km/h"
    )

    st.caption(
        "Driver recommendations are generated "
        "using demonstration rules. "
        "These rules have not been validated "
        "for real vehicle safety decisions."
    )

    st.divider()


    # ========================================================
    # 20. TECHNICAL RESULT
    # ========================================================

    st.header("8. Technical Results")

    st.success(
        "Integrated detection completed successfully."
    )

    with st.expander(
        "View Full Risk Fusion Output"
    ):

        st.json(fusion_result)

    with st.expander(
        "View Sensor Model Output"
    ):

        st.json(sensor_result)

    with st.expander(
        "View Camera Model Output"
    ):

        st.json(camera_result)

    st.caption(
        f"Result saved to: {result['saved_path']}"
    )


# ============================================================
# 21. DEMO LIMITATIONS
# ============================================================

st.divider()

st.caption(
    "ROADGUARDIAN ENGINEERING DEMONSTRATION | "
    "Sensor measurements are generated using "
    "a Quarter-Car numerical model. "
    "Camera images are independent inputs. "
    "The two sources are paired to demonstrate "
    "software integration, not synchronized "
    "real-world multi-sensor validation."
)