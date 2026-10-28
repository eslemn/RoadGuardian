"""RoadGuardian Sensor Intelligence v1 — synthetic-data baseline.

From project root:
    python detection/sensor_ml/train_model.py

Three leave-one-road-profile-variant-out folds prevent the *same profile*
from appearing in both train and test via different speeds. Results are
exploratory and are NOT estimates of road performance.
"""
from pathlib import Path
import re
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import LeaveOneGroupOut
import joblib

SIM_DIR = Path(__file__).resolve().parents[1] / "simulation"
FEATURE_ROOT = SIM_DIR / "outputs" / "sensor_ml"
LABELS = ["normal", "pothole", "speed_bump"]


def train_experiment(frame, feature_cols, experiment_name, output):
    X = frame[feature_cols]
    y = frame["road_type"].astype(str).to_numpy()
    groups = frame["profile_variant"].to_numpy()
    logo = LeaveOneGroupOut()
    predictions = np.empty(len(frame), dtype=object)
    fold_rows = []

    for fold, (train_idx, test_idx) in enumerate(logo.split(X, y, groups), start=1):
        model = RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            max_depth=4,
            min_samples_leaf=2,
            class_weight="balanced",
            n_jobs=-1,
        )
        model.fit(X.iloc[train_idx], y[train_idx])
        pred = model.predict(X.iloc[test_idx])
        predictions[test_idx] = pred
        fold_rows.append({
            "experiment": experiment_name,
            "fold": fold,
            "test_profile_variant": int(groups[test_idx][0]),
            "n_train": len(train_idx),
            "n_test": len(test_idx),
            "accuracy": accuracy_score(y[test_idx], pred),
            "macro_f1": f1_score(y[test_idx], pred, labels=LABELS, average="macro", zero_division=0),
        })

    output.mkdir(parents=True, exist_ok=True)
    pred_df = frame[["scenario_id", "road_type", "profile_variant"]].copy()
    pred_df["prediction"] = predictions
    pred_df["correct"] = pred_df["road_type"] == pred_df["prediction"]
    pred_df.to_csv(output / f"{experiment_name}_predictions.csv", index=False)
    pd.DataFrame(fold_rows).to_csv(output / f"{experiment_name}_fold_metrics.csv", index=False)

    cm = confusion_matrix(y, predictions, labels=LABELS)
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(3), LABELS, rotation=20)
    ax.set_yticks(range(3), LABELS)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title(f"RoadGuardian — {experiment_name} (held-out profiles)")
    for i in range(3):
        for j in range(3):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center")
    fig.tight_layout()
    fig.savefig(output / f"{experiment_name}_confusion_matrix.png", dpi=160)
    plt.close(fig)

    # Train a demonstrator on all *synthetic* records after out-of-fold evaluation.
    final_model = RandomForestClassifier(
        n_estimators=200, random_state=42, max_depth=4,
        min_samples_leaf=2, class_weight="balanced", n_jobs=-1,
    )
    final_model.fit(X, y)
    joblib.dump({"model": final_model, "features": feature_cols,
                 "classes": LABELS, "synthetic_only": True},
                output / f"{experiment_name}_synthetic_model.joblib")

    print(f"\n{experiment_name}")
    print("Features:", len(feature_cols))
    print("Held-out-profile accuracy:", round(accuracy_score(y, predictions), 3))
    print("Held-out-profile macro F1:", round(f1_score(y, predictions, labels=LABELS, average="macro", zero_division=0), 3))
    print(classification_report(y, predictions, labels=LABELS, zero_division=0))
    return {"experiment": experiment_name,
            "n_features": len(feature_cols),
            "accuracy": accuracy_score(y, predictions),
            "macro_f1": f1_score(y, predictions, labels=LABELS, average="macro", zero_division=0)}


def main():
    candidates = [p for p in FEATURE_ROOT.glob("*/features.csv")]
    if not candidates:
        raise FileNotFoundError(f"No features.csv under {FEATURE_ROOT}")
    feature_file = max(candidates, key=lambda p: p.stat().st_mtime)
    df = pd.read_csv(feature_file)
    required = {"scenario_id", "road_type", "speed_kmh", "speed_mps"}
    if not required.issubset(df.columns):
        raise ValueError(f"Missing columns: {required - set(df.columns)}")
    if len(df) != 27 or df["road_type"].value_counts().to_dict() != {k: 9 for k in LABELS}:
        raise ValueError("Expected 27 scenarios balanced across normal / pothole / speed_bump")
    variants = df["scenario_id"].astype(str).str.extract(r"_v([1-3])$", expand=False)
    if variants.isna().any():
        raise ValueError("Scenario IDs must end with _v1, _v2 or _v3")
    df["profile_variant"] = variants.astype(int)
    # Never train on labels, IDs, known scenario geometry, or speed metadata.
    non_features = {"scenario_id", "road_type", "speed_kmh", "speed_mps", "profile_variant"}
    all_features = [c for c in df.columns if c not in non_features and pd.api.types.is_numeric_dtype(df[c])]
    body_features = [c for c in all_features if c.startswith("body_acc_")]
    if len(body_features) != 6 or len(all_features) < 6:
        raise ValueError(f"Unexpected features: body={body_features}, all={all_features}")
    if not np.isfinite(df[all_features].to_numpy(dtype=float)).all():
        raise ValueError("Non-finite numeric features")

    output = feature_file.parent / "ml_results"
    print("ROADGUARDIAN SENSOR INTELLIGENCE V1")
    print("--------------------------------")
    print("Source:", feature_file)
    print("27 synthetic scenarios; 3 held-out road-profile folds")
    summaries = [
        train_experiment(df, body_features, "body_acc_only", output),
        train_experiment(df, all_features, "all_available_signals", output),
    ]
    pd.DataFrame(summaries).to_csv(output / "experiment_comparison.csv", index=False)
    print("\nOutputs:", output)
    print("CAUTION: These scores are exploratory synthetic-data checks, NOT real-road validation.")
    print("The 3 profiles per road type share a simulator and are not independent real-world drives.")


if __name__ == "__main__":
    main()
