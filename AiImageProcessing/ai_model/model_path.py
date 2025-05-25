import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import pickle
import numpy as np
import os
import requests
from io import BytesIO
import base64

def predict_image(image_path):
    # ===== CONFIG =====
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(BASE_DIR, "best_model.pth")
    ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

    # ===== DEVICE =====
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # ===== TRANSFORM =====
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
    ])

    # ===== LOAD LABEL ENCODER =====
    try:
        with open(ENCODER_PATH, "rb") as f:
            label_encoder = pickle.load(f)
        classes = label_encoder.classes_
    except FileNotFoundError:
        raise Exception(f"Label encoder file not found at {ENCODER_PATH}")

    # ===== LOAD MODEL =====
    try:
        num_classes = len(classes)
        model = models.resnet18()
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model.to(device)
        model.eval()
    except FileNotFoundError:
        raise Exception(f"Model file not found at {MODEL_PATH}")

    # ===== LOAD IMAGE =====
    try:
        if image_path.startswith(("http://", "https://")):
            # Load from URL
            response = requests.get(image_path, stream=True, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGB")
        elif image_path.startswith("data:image"):
            # Load from base64-encoded string
            base64_data = image_path.split(",")[1]  # Extract base64 data
            image_data = base64.b64decode(base64_data)  # Decode base64
            image = Image.open(BytesIO(image_data)).convert("RGB")
        else:
            # Load from local file
            image = Image.open(image_path).convert("RGB")
        
        image_tensor = transform(image).unsqueeze(0).to(device)
    except requests.RequestException as e:
        raise Exception(f"Failed to download image from URL: {str(e)}")
    except FileNotFoundError:
        raise Exception(f"Image file not found at {image_path}")
    except base64.binascii.Error:
        raise Exception("Invalid base64 image data")
    except Exception as e:
        raise Exception(f"Failed to process image: {str(e)}")

    # ===== PREDICT & PROBS =====
    with torch.no_grad():
        output = model(image_tensor)
        probabilities = torch.softmax(output, dim=1).cpu().numpy()[0]
        predicted_idx = np.argmax(probabilities)
        predicted_label = label_encoder.inverse_transform([predicted_idx])[0]

    # ===== PREPARE RESPONSE =====
    sorted_indices = np.argsort(probabilities)[::-1]
    class_distribution = {
        "predicted_class": predicted_label,
        "probabilities": {
            classes[idx]: round(float(probabilities[idx] * 100), 4)  # Round to 4 decimal places
            for idx in sorted_indices
        }
    }

    return class_distribution

if __name__ == "__main__":
    # Example usage
    IMAGE_PATH = r"C:\Users\ioan1\Desktop\Licenta\AiImageProcessing\utils\cancer mole 5.jpeg"
    try:
        result = predict_image(IMAGE_PATH)
        print("\nPrediction result:")
        print(f"Predicted class: {result['predicted_class']}")
        print("\nProbabilities:")
        for class_name, prob in result['probabilities'].items():
            print(f"{class_name}: {prob:.4f}%")
    except Exception as e:
        print(f"Error: {str(e)}")
