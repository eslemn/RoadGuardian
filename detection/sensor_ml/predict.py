from pathlib import Path
import joblib
import pandas as pd


MODEL_ROOT = (
    Path(__file__).resolve().parents[1]
    / "simulation"
    / "outputs"
    / "sensor_ml"
)


class RoadGuardianSensorPredictor:

    def __init__(self):

        model_files = list(
            MODEL_ROOT.rglob(
                "all_available_signals_synthetic_model.joblib"
            )
        )

        if not model_files:
            raise FileNotFoundError(
                "Egitilmis sensor modeli bulunamadi."
            )

        model_path = max(
            model_files,
            key=lambda p: p.stat().st_mtime
        )

        model_data = joblib.load(model_path)

        self.model = model_data["model"]
        self.feature_names = model_data["features"]
        self.synthetic_only = model_data["synthetic_only"]

        print("RoadGuardian Sensor Model Loaded")

    def predict(self, sensor_features):

        missing = [
            feature
            for feature in self.feature_names
            if feature not in sensor_features
        ]

        if missing:
            raise ValueError(
                f"Eksik ozellikler: {missing}"
            )

        X = pd.DataFrame(
            [{
                feature: sensor_features[feature]
                for feature in self.feature_names
            }]
        )

        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]

        scores = {
            label: round(float(score), 4)
            for label, score in zip(
                self.model.classes_,
                probabilities
            )
        }

        return {
            "source": "sensor",
            "road_type": str(prediction),
            "confidence": scores[prediction],
            "scores": scores,
            "synthetic_only": self.synthetic_only,
        }