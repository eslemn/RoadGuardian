"""
demo/services/advisory_service.py
====================================
Driver advisory rule engine.

All advisory logic is rule-based — not a machine learning model.
Rules are identical to those in the original app.py.
No threshold, speed boundary, or message text has been changed.
"""


def generate_driver_advisory(fusion_result: dict, vehicle_speed: int) -> dict:
    """
    Produce a structured driver advisory from a fusion result.

    This function applies demonstrative, rule-based safety guidelines.
    The rules have **not** been validated for real vehicle safety decisions.

    Parameters
    ----------
    fusion_result  : dict returned by fuse_predictions()
    vehicle_speed  : int  vehicle speed in km/h (30, 50, or 70)

    Returns
    -------
    dict with keys:
        level   : "none" | "caution" | "high"
        title   : str  short advisory headline
        message : str  full advisory message
    """

    warning = fusion_result["warning"]
    road_type = fusion_result["road_type"]
    fusion_status = fusion_result["fusion_status"]

    # -- No risk detected ----------------------------------------
    if not warning:
        return {
            "level": "none",
            "title": "No Active Road Hazard Warning",
            "message": (
                "The current model outputs did not "
                "trigger a road hazard warning."
            ),
        }

    # -- Conflicting model predictions ---------------------------
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

    # -- Pothole advisory ----------------------------------------
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

        if vehicle_speed == 50:
            return {
                "level": "caution",
                "title": "Pothole Risk Detected",
                "message": (
                    "Potential pothole ahead. "
                    "Consider reducing speed gradually "
                    "if road conditions allow."
                ),
            }

        # 70 km/h or any other speed
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

    # -- Speed bump advisory -------------------------------------
    if road_type == "speed_bump":
        return {
            "level": "caution",
            "title": "Speed Bump Risk Detected",
            "message": (
                "Potential speed bump ahead. "
                "Adjust speed smoothly when safe."
            ),
        }

    # -- Unknown / other road hazard -----------------------------
    return {
        "level": "caution",
        "title": "Possible Road Hazard",
        "message": (
            "A possible road hazard was detected. "
            "Proceed carefully."
        ),
    }
