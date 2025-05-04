import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import pickle
import matplotlib.pyplot as plt
import numpy as np

# ===== CONFIG =====
MODEL_PATH = "best_model.pth"
ENCODER_PATH = "label_encoder.pkl"
IMAGE_PATH = r"C:\Users\ioan1\Desktop\Licenta\AiImageProcessing\utils\cancerous mole.jpeg"

# ===== DEVICE =====
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ===== TRANSFORM =====
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

# ===== LOAD LABEL ENCODER =====
with open(ENCODER_PATH, "rb") as f:
    label_encoder = pickle.load(f)
classes = label_encoder.classes_
print("Loaded label classes:", classes)

# ===== LOAD MODEL =====
num_classes = len(classes)
model = models.resnet18()
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.to(device)
model.eval()
print("Model loaded successfully!")

# ===== LOAD IMAGE =====
image = Image.open(IMAGE_PATH).convert("RGB")
image_tensor = transform(image).unsqueeze(0).to(device)  # Add batch dimension

# ===== PREDICT & PROBS =====
with torch.no_grad():
    output = model(image_tensor)
    probabilities = torch.softmax(output, dim=1).cpu().numpy()[0]
    predicted_idx = np.argmax(probabilities)
    predicted_label = label_encoder.inverse_transform([predicted_idx])[0]

# ===== DISPLAY RESULTS =====
print(f"\n✅ Predicted class: {predicted_label}\n")

# Show probabilities for all classes
sorted_indices = np.argsort(probabilities)[::-1]
print("📊 Probabilities per class:")
for idx in sorted_indices:
    print(f" - {classes[idx]}: {probabilities[idx]*100:.2f}%")

# ===== OPTIONAL: PLOT BAR CHART =====
plt.figure(figsize=(10, 5))
plt.bar([classes[i] for i in sorted_indices], [probabilities[i] for i in sorted_indices], color="skyblue")
plt.ylabel("Probability")
plt.title(f"Prediction: {predicted_label}")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
