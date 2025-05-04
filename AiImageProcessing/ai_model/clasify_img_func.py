import torch
from torchvision import transforms
from PIL import Image
import requests
import torch.nn as nn
from io import BytesIO
import pickle
import base64
from torchvision import transforms, models

from ai_model.conventional_neural_model import SkinCancerCNN

# Configuration
MODEL_PATH = 'ai_model/best_model.pth'
LABEL_ENCODER_PATH = r"C:\Users\ioan1\Desktop\Licenta\AiImageProcessing\ai_model\label_encoder.pkl"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load Label Encoder
with open(LABEL_ENCODER_PATH, "rb") as f:
    label_encoder = pickle.load(f)
classes = label_encoder.classes_

# Initialize and load model
num_classes = len(classes)
model = models.resnet18(pretrained=False)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model = model.to(DEVICE)
model.eval()

# Define image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])


def classify_mole(image_source):
    """
    Classify a mole image from a file path, URL, or base64-encoded string.

    Args:
        image_source (str): Path to local image file, URL of the image, or base64-encoded image.

    Returns:
        dict: A dictionary containing:
            - status: "success" or "error"
            - diagnosis: Predicted class (e.g., "bcc")
            - confidence: Confidence score (0.0 to 1.0)
            - message: Error message (if status is "error")
    """
    try:
        # Load image
        if image_source.startswith(("http://", "https://")):
            # Load from URL
            response = requests.get(image_source, stream=True, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGB")
        elif image_source.startswith("data:image"):
            # Load from base64-encoded string
            base64_data = image_source.split(",")[1]  # Extract base64 data
            image_data = base64.b64decode(base64_data)  # Decode base64
            image = Image.open(BytesIO(image_data)).convert("RGB")

        else:
            # Load from local file
            image = Image.open(image_source).convert("RGB")

        # Transform and predict
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)

        predicted_label = label_encoder.inverse_transform([predicted.cpu().item()])[0]
        return {
            "status": "success",
            "diagnosis": predicted_label,
            "confidence": confidence.item(),
            "message": "Prediction successful"
        }

    except Exception as e:
        return {
            "status": "error",
            "diagnosis": None,
            "confidence": None,
            "message": str(e)
        }