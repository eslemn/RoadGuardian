"""
demo/app.py
===========
RoadGuardian Streamlit application — main entry point.

Responsibilities
----------------
* Streamlit page configuration and global style injection.
* Sidebar scenario selection and session-state management.
* Orchestration: call services → pass data to UI components.
* Guard against stale results when the user changes the scenario.

Run from the project root with:
    python -m streamlit run demo/app.py
"""

import sys
from pathlib import Path

import streamlit as st

# ------------------------------------------------------------------ #
# 1. Project root on sys.path                                         #
# ------------------------------------------------------------------ #

PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ------------------------------------------------------------------ #
# 2. Local imports                                                     #
# ------------------------------------------------------------------ #

from demo.components import charts, ui
from demo.services import simulation_service as sim
from demo.services import detection_service as det
from demo.services.advisory_service import generate_driver_advisory

# ------------------------------------------------------------------ #
# 3. Page configuration (must be the first Streamlit call)            #
# ------------------------------------------------------------------ #

st.set_page_config(
    page_title="RoadGuardian | Integrated MVP",
    page_icon="🚘",
    layout="wide",
    initial_sidebar_state="expanded",
)

ui.inject_styles()

# ------------------------------------------------------------------ #
# 4. Sidebar — scenario selection                                      #
# ------------------------------------------------------------------ #

st.sidebar.title("🚘 RoadGuardian")
st.sidebar.markdown("### Driving Scenario Configuration")
st.sidebar.divider()

selected_road_type = st.sidebar.selectbox(
    "Road Condition",
    options=["pothole"],
    format_func=lambda road: {"pothole": "Pothole"}[road],
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

scenario_id = sim.build_scenario_id(
    selected_road_type, selected_speed, selected_variant
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

# ------------------------------------------------------------------ #
# 5. Header                                                           #
# ------------------------------------------------------------------ #

ui.render_header()

# ------------------------------------------------------------------ #
# 6. Scenario summary metrics                                         #
# ------------------------------------------------------------------ #

ui.render_scenario_metrics(selected_road_type, selected_speed, selected_variant)

# ------------------------------------------------------------------ #
# 7. Input file validation                                            #
# ------------------------------------------------------------------ #

missing_files = [
    str(p)
    for p in sim.get_required_files(scenario_id)
    if not p.exists()
]

if missing_files:
    st.error(
        "Some files required for the selected "
        "scenario could not be found."
    )
    st.code("\n".join(missing_files))
    st.stop()

# ------------------------------------------------------------------ #
# 8. Load simulation data                                             #
# ------------------------------------------------------------------ #

sensor_csv = sim.get_sensor_csv(scenario_id)

signals = sim.load_sensor_signals(str(sensor_csv))

try:
    feature_row = sim.get_feature_row(scenario_id)
except ValueError as exc:
    st.error(str(exc))
    st.stop()

# ------------------------------------------------------------------ #
# 9. Physical metrics                                                 #
# ------------------------------------------------------------------ #

metrics = sim.calculate_physical_metrics(signals)

ui.render_physical_metrics(metrics)

# ------------------------------------------------------------------ #
# 10. Detection inputs (charts + camera panel)                        #
# ------------------------------------------------------------------ #

chart_builders = {
    "road_profile": charts.road_profile_chart,
    "body_acceleration": charts.body_acceleration_chart,
    "wheel_acceleration": charts.wheel_acceleration_chart,
    "suspension_travel": charts.suspension_travel_chart,
}

ui.render_detection_inputs(
    signals=signals,
    scenario_id=scenario_id,
    camera_image_path=sim.CAMERA_IMAGE,
    chart_builders=chart_builders,
)

# ------------------------------------------------------------------ #
# 11. Run detection button                                            #
# ------------------------------------------------------------------ #

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

        with st.spinner("Running sensor and camera models..."):

            detection_output = det.run_detection(
                feature_row=feature_row,
                camera_image_path=sim.CAMERA_IMAGE,
                scenario_id=scenario_id,
                speed=selected_speed,
            )

            advisory = generate_driver_advisory(
                detection_output["fusion"],
                selected_speed,
            )

            st.session_state["demo_result"] = {
                "scenario_id": scenario_id,
                "speed": selected_speed,
                "sensor": detection_output["sensor"],
                "camera": detection_output["camera"],
                "fusion": detection_output["fusion"],
                "advisory": advisory,
                "saved_path": detection_output["saved_path"],
            }

    except Exception as error:
        st.error("An error occurred during detection.")
        st.exception(error)

# ------------------------------------------------------------------ #
# 12. Display results (only when scenario matches stored result)      #
# ------------------------------------------------------------------ #

result_is_current = (
    "demo_result" in st.session_state
    and st.session_state["demo_result"]["scenario_id"] == scenario_id
)

if result_is_current:

    result = st.session_state["demo_result"]

    ui.render_prediction_cards(result["sensor"], result["camera"])

    ui.render_fusion_result(result["fusion"])

    ui.render_driver_advisory(result["advisory"], result["speed"])

    ui.render_technical_results(
        fusion_result=result["fusion"],
        sensor_result=result["sensor"],
        camera_result=result["camera"],
        saved_path=result["saved_path"],
    )

# ------------------------------------------------------------------ #
# 13. Footer                                                          #
# ------------------------------------------------------------------ #

ui.render_footer()