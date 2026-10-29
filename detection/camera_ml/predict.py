from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf


MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "best_pothole_model.keras"
)


class RoadGuardianCameraPredictor:

    def __init__(self, threshold=0.5):

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Camera model not found: {MODEL_PATH}"
            )

        self.model = tf.keras.models.load_model(
            MODEL_PATH,
            compile=False
        )

        self.threshold = threshold

        print("RoadGuardian Camera Model Loaded")

    def predict(self, image_path):

        image = cv2.imread(str(image_path))

        if image is None:
            raise FileNotFoundError(
                f"Image not found: {image_path}"
            )

        # Zeynep'in video_test.py koduyla uyumlu
        image = cv2.resize(image, (224, 224))
        image = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB
        )

        X = np.expand_dims(
            image.astype("float32"),
            axis=0
        )

        raw_output = float(
            self.model(
                X,
                training=False
            ).numpy()[0][0]
        )

        # Zeynep'in mevcut kodundaki sınıf sıralaması
        pothole_score = raw_output
        normal_score = 1.0 - raw_output

        road_type = (
            "pothole"
            if pothole_score >= self.threshold
            else "normal"
        )

        return {
            "source": "camera",
            "road_type": road_type,
            "confidence": (
                pothole_score
                if road_type == "pothole"
                else normal_score
            ),
            "scores": {
                "normal": normal_score,
                "pothole": pothole_score
            },
            "model_type": "MobileNetV2",
            "image_path": str(image_path)
        }