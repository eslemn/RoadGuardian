import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

model = tf.keras.models.load_model("best_pothole_model.keras")

# Colab'da print(class_names) çıktısına göre düzelt
class_names = ["normal", "potholes"]
pothole_idx = next(i for i, c in enumerate(class_names) if "pothole" in c.lower())

img = image.load_img("test6.jpg", target_size=(224, 224))
arr = np.expand_dims(image.img_to_array(img), 0)

p = model.predict(arr, verbose=0)[0][0]
p_pothole = p if pothole_idx == 1 else 1 - p

print("ÇUKUR VAR" if p_pothole > 0.5 else "Çukur yok", f"(%{p_pothole*100:.1f})")