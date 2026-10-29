"""
demo/components/ui.py
=====================
Reusable Streamlit UI components for RoadGuardian.

Each public function renders one logical section of the dashboard.
All rendered HTML, CSS classes, and text match the original app.py exactly.
"""

import streamlit as st


# ------------------------------------------------------------------ #
# CSS injection                                                       #
# ------------------------------------------------------------------ #

APP_STYLE = """
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
"""


def inject_styles():
    """Inject global CSS into the Streamlit page."""
    st.markdown(APP_STYLE, unsafe_allow_html=True)


# ------------------------------------------------------------------ #
# Header                                                              #
# ------------------------------------------------------------------ #

def render_header():
    """Render the main application title and caption."""
    st.title("🚘 ROADGUARDIAN")
    st.subheader("Intelligent Road Hazard Detection")
    st.caption(
        "Integrated MVP | Numerical Simulation "
        "+ Camera Intelligence + Risk Fusion"
    )
    st.divider()


# ------------------------------------------------------------------ #
# Scenario summary                                                    #
# ------------------------------------------------------------------ #

def render_scenario_metrics(road_type, speed, variant):
    """
    Render the four scenario summary metric cards.

    Parameters
    ----------
    road_type : str   e.g. "pothole"
    speed     : int   e.g. 30
    variant   : int   e.g. 1
    """
    st.header("1. Driving Scenario")

    c1, c2, c3, c4 = st.columns(4)

    c1.metric("Road Condition", road_type.upper())
    c2.metric("Vehicle Speed", f"{speed} km/h")
    c3.metric("Simulation Profile", f"Variant {variant}")
    c4.metric("Data Source", "SYNTHETIC")

    st.info(
        f"Selected Scenario: A vehicle travelling at "
        f"{speed} km/h encounters a simulated pothole. "
        f"Profile variant: {variant}."
    )


# ------------------------------------------------------------------ #
# Physical response metrics                                           #
# ------------------------------------------------------------------ #

def render_physical_metrics(metrics):
    """
    Render the four physical response metric cards.

    Parameters
    ----------
    metrics : dict with keys
        peak_body_acc, peak_wheel_acc,
        max_suspension_travel_cm, rms_body_acc
    """
    st.header("2. Vehicle Physical Response")

    st.write(
        "The following measurements are calculated "
        "from the selected Quarter-Car simulation."
    )

    m1, m2, m3, m4 = st.columns(4)

    m1.metric(
        "Peak Body Acceleration",
        f"{metrics['peak_body_acc']:.2f} m/s²",
    )
    m2.metric(
        "Peak Wheel Acceleration",
        f"{metrics['peak_wheel_acc']:.2f} m/s²",
    )
    m3.metric(
        "Peak Suspension Travel",
        f"{metrics['max_suspension_travel_cm']:.2f} cm",
    )
    m4.metric(
        "RMS Body Acceleration",
        f"{metrics['rms_body_acc']:.2f} m/s²",
    )

    st.caption(
        "These are simulated physical measurements, "
        "not real vehicle telemetry."
    )

    st.divider()


# ------------------------------------------------------------------ #
# Sensor charts panel + camera image panel                            #
# ------------------------------------------------------------------ #

def render_detection_inputs(
    signals,
    scenario_id,
    camera_image_path,
    chart_builders,
):
    """
    Render Section 3: sensor signal charts (left) + camera panel (right).

    Parameters
    ----------
    signals          : DataFrame of sensor time-series data.
    scenario_id      : str  e.g. "pothole_30kmh_v1"
    camera_image_path: Path to the road camera image.
    chart_builders   : dict with keys
                         road_profile, body_acceleration,
                         wheel_acceleration, suspension_travel
                       Each value is a callable(df) -> Figure.
    """
    st.header("3. RoadGuardian Detection Inputs")

    sensor_col, camera_col = st.columns([1.3, 1], gap="large")

    # -- Sensor side -----------------------------------------------
    with sensor_col:

        st.subheader("📊 Numerical Sensor Simulation")

        st.plotly_chart(
            chart_builders["road_profile"](signals),
            use_container_width=True,
        )
        st.plotly_chart(
            chart_builders["body_acceleration"](signals),
            use_container_width=True,
        )
        st.plotly_chart(
            chart_builders["wheel_acceleration"](signals),
            use_container_width=True,
        )
        st.plotly_chart(
            chart_builders["suspension_travel"](signals),
            use_container_width=True,
        )

        st.caption(f"Quarter-Car Model | Scenario: {scenario_id}")

    # -- Camera side -----------------------------------------------
    with camera_col:

        st.subheader("📷 Camera-Based Road Analysis")

        st.image(
            str(camera_image_path),
            caption="Road Image - Pothole Scenario",
            use_container_width=True,
        )

        st.markdown("### Camera Model")
        st.write("**Architecture:** MobileNetV2")
        st.write("**Classification:** Normal Road / Pothole")
        st.write("**Input Resolution:** 224 × 224")
        st.info(
            "The camera model analyzes the road image "
            "independently of the numerical simulation."
        )

        st.markdown("### Sensor Model")
        st.write("**Algorithm:** Random Forest")
        st.write("**Input:** 24 numerical sensor features")
        st.write("**Classes:** Normal / Pothole / Speed Bump")


# ------------------------------------------------------------------ #
# ML Prediction cards                                                 #
# ------------------------------------------------------------------ #

def render_prediction_cards(sensor_result, camera_result):
    """
    Render sensor and camera prediction metric cards side by side.

    Parameters
    ----------
    sensor_result : dict from RoadGuardianSensorPredictor.predict()
    camera_result : dict from RoadGuardianCameraPredictor.predict()
    """
    st.header("5. Machine Learning Predictions")

    left, right = st.columns(2, gap="large")

    with left:
        st.subheader("📊 Sensor Intelligence")
        st.metric(
            "Predicted Road Type",
            sensor_result["road_type"].upper(),
        )
        st.metric(
            "Model Score",
            f"{sensor_result['confidence'] * 100:.2f}%",
        )
        st.caption("Random Forest | Synthetic Quarter-Car Data")

    with right:
        st.subheader("📷 Camera Intelligence")
        st.metric(
            "Predicted Road Type",
            camera_result["road_type"].upper(),
        )
        st.metric(
            "Model Score",
            f"{camera_result['confidence'] * 100:.2f}%",
        )
        st.caption("MobileNetV2 | Independent Road Image")

    st.caption(
        "Model scores represent class prediction "
        "scores for these inputs, not independently "
        "validated real-world detection accuracy."
    )

    st.divider()


# ------------------------------------------------------------------ #
# Risk fusion result                                                  #
# ------------------------------------------------------------------ #

def render_fusion_result(fusion_result):
    """
    Render Section 6: Risk Fusion Engine decision box and warning banner.

    Parameters
    ----------
    fusion_result : dict from fuse_predictions()
    """
    st.header("6. RoadGuardian Risk Fusion")

    fusion_status = fusion_result["fusion_status"]

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

        road_type = fusion_result["road_type"]

        if road_type == "pothole":
            driver_warning = "⚠️ POTHOLE RISK DETECTED"
        elif road_type == "speed_bump":
            driver_warning = "⚠️ SPEED BUMP RISK DETECTED"
        else:
            driver_warning = "⚠️ POSSIBLE ROAD HAZARD"

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

    st.write("**Fusion Status:**", fusion_status)
    st.write("**Technical Message:**", fusion_result["warning_message"])

    st.divider()


# ------------------------------------------------------------------ #
# Driver advisory                                                     #
# ------------------------------------------------------------------ #

def render_driver_advisory(advisory_result, speed):
    """
    Render Section 7: Driver advisory message.

    Parameters
    ----------
    advisory_result : dict from advisory_service.generate_driver_advisory()
    speed           : int  selected vehicle speed in km/h
    """
    st.header("7. Driver Advisory")

    st.subheader(advisory_result["title"])

    level = advisory_result["level"]

    if level == "high":
        st.error(advisory_result["message"])
    elif level == "caution":
        st.warning(advisory_result["message"])
    else:
        st.info(advisory_result["message"])

    st.caption(f"Selected vehicle speed: {speed} km/h")

    st.caption(
        "Driver recommendations are generated "
        "using demonstration rules. "
        "These rules have not been validated "
        "for real vehicle safety decisions."
    )

    st.divider()


# ------------------------------------------------------------------ #
# Technical results                                                   #
# ------------------------------------------------------------------ #

def render_technical_results(
    fusion_result,
    sensor_result,
    camera_result,
    saved_path,
):
    """
    Render Section 8: expandable JSON outputs + saved path caption.

    Parameters
    ----------
    fusion_result  : dict
    sensor_result  : dict
    camera_result  : dict
    saved_path     : str  path where the CSV row was appended
    """
    st.header("8. Technical Results")

    st.success("Integrated detection completed successfully.")

    with st.expander("View Full Risk Fusion Output"):
        st.json(fusion_result)

    with st.expander("View Sensor Model Output"):
        st.json(sensor_result)

    with st.expander("View Camera Model Output"):
        st.json(camera_result)

    st.caption(f"Result saved to: {saved_path}")


# ------------------------------------------------------------------ #
# Footer                                                              #
# ------------------------------------------------------------------ #

def render_footer():
    """Render the demo-limitations caption at the bottom of the page."""
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
