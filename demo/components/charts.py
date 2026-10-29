"""
demo/components/charts.py
=========================
Plotly chart generation for RoadGuardian sensor signals.

All charts use the same style that was in the original app.py.
No chart configuration or colour palette has been changed.
"""

import plotly.graph_objects as go


# ------------------------------------------------------------------ #
# Internal helper                                                     #
# ------------------------------------------------------------------ #

def _build_line_chart(df, column, title, y_axis, color):
    """
    Generic single-trace line chart for one sensor signal column.

    Parameters
    ----------
    df      : DataFrame with a ``time_s`` column and the target column.
    column  : Name of the y-axis data column.
    title   : Chart and trace title.
    y_axis  : Y-axis label text.
    color   : Hex colour string for the trace line.
    """

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
        margin=dict(l=20, r=20, t=45, b=20),
        hovermode="x unified",
    )

    return fig


# ------------------------------------------------------------------ #
# Public chart builders                                               #
# ------------------------------------------------------------------ #

def road_profile_chart(df):
    """Simulated road displacement profile."""
    return _build_line_chart(
        df,
        column="road_displacement_m",
        title="Simulated Road Profile",
        y_axis="Displacement (m)",
        color="#0077B6",
    )


def body_acceleration_chart(df):
    """Vehicle body vertical acceleration."""
    return _build_line_chart(
        df,
        column="vertical_accel_ms2",
        title="Vehicle Body Acceleration",
        y_axis="Acceleration (m/s²)",
        color="#E76F51",
    )


def wheel_acceleration_chart(df):
    """Wheel vertical acceleration."""
    return _build_line_chart(
        df,
        column="vertical_wheel_accel_ms2",
        title="Wheel Acceleration",
        y_axis="Acceleration (m/s²)",
        color="#2A9D8F",
    )


def suspension_travel_chart(df):
    """Suspension travel."""
    return _build_line_chart(
        df,
        column="suspension_travel_m",
        title="Suspension Travel",
        y_axis="Travel (m)",
        color="#9B5DE5",
    )
