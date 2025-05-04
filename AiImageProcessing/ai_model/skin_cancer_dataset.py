import os
import pickle

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
from conventional_neural_model import SkinCancerCNN
from sklearn.metrics import classification_report, f1_score
from torchvision import models
from torch.utils.tensorboard import SummaryWriter



# Paths
dataset_path = r"C:\Users\ioan1\.cache\kagglehub\datasets\kmader\skin-cancer-mnist-ham10000\versions\2"
images_part1 = os.path.join(dataset_path, "HAM10000_images_part_1")
images_part2 = os.path.join(dataset_path, "HAM10000_images_part_2")
metadata_path = os.path.join(dataset_path, "HAM10000_metadata.csv")

# Load metadata
metadata = pd.read_csv(metadata_path)

# Combine image paths for Part 1 and Part 2
images_path_map = {image_id: os.path.join(images_part1, f"{image_id}.jpg")
                   if os.path.exists(os.path.join(images_part1, f"{image_id}.jpg"))
                   else os.path.join(images_part2, f"{image_id}.jpg")
                   for image_id in metadata['image_id']}

# Verify image paths exist
metadata['image_path'] = metadata['image_id'].map(images_path_map)
assert all(metadata['image_path'].apply(os.path.exists)), "Some image paths are missing!"

# Encode labels
label_encoder = LabelEncoder()
metadata['dx_encoded'] = label_encoder.fit_transform(metadata['dx'])

LABEL_ENCODER_PATH = "label_encoder.pkl"
with open(LABEL_ENCODER_PATH, "wb") as f:
    pickle.dump(label_encoder, f)

print(f"Label encoder saved at {LABEL_ENCODER_PATH}")

# Split dataset
train_metadata, val_metadata = train_test_split(metadata, test_size=0.2, stratify=metadata['dx_encoded'], random_state=42)
print(metadata.__sizeof__())
# Image Transformations
train_transforms = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(20),
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

# Custom Dataset
class SkinCancerDataset(Dataset):
    def __init__(self, metadata, transform=None):
        self.metadata = metadata
        self.transform = transform

    def __len__(self):
        return len(self.metadata)

    def __getitem__(self, idx):
        row = self.metadata.iloc[idx]
        image_path = row['image_path']
        label = row['dx_encoded']

        # Load and transform image
        image = Image.open(image_path).convert("RGB")  # Ensure RGB format
        if self.transform:
            image = self.transform(image)

        return image, label

# Create datasets and dataloaders
train_dataset = SkinCancerDataset(train_metadata, transform=train_transforms)
val_dataset = SkinCancerDataset(val_metadata, transform=val_transforms)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# Print a sample from the dataloader
data_iter = iter(train_loader)
sample_images, sample_labels = next(data_iter)
print(f"Sample Images Shape: {sample_images.shape}")
print(f"Sample Labels: {sample_labels[:5]}")

# Device configuration (use GPU if available)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Define a simple training loop
def train_model(model, train_loader, val_loader, criterion, optimizer, num_epochs=30, patience=5):
    best_loss = float('inf')
    patience_counter = 0

    writer = SummaryWriter(log_dir="runs/skin_cancer_classification")  # 👈

    for epoch in range(num_epochs):
        print(f"\nEpoch {epoch + 1}/{num_epochs}")

        # --- Training ---
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()

        train_loss = running_loss / len(train_loader)
        print(f"Training Loss: {train_loss:.4f}")

        # --- Validation ---
        model.eval()
        val_loss = 0.0
        all_preds = []
        all_labels = []
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                _, preds = torch.max(outputs, 1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        avg_val_loss = val_loss / len(val_loader)
        accuracy = (np.array(all_preds) == np.array(all_labels)).mean() * 100
        f1 = f1_score(all_labels, all_preds, average='macro') * 100

        print(f"Val Loss: {avg_val_loss:.4f} | Acc: {accuracy:.2f}% | F1: {f1:.2f}%")

        # 🧠 Log metrics to TensorBoard
        writer.add_scalar("Loss/train", train_loss, epoch)
        writer.add_scalar("Loss/val", avg_val_loss, epoch)
        writer.add_scalar("Accuracy/val", accuracy, epoch)
        writer.add_scalar("F1_score/val", f1, epoch)

        # --- Early stopping ---
        if avg_val_loss < best_loss:
            best_loss = avg_val_loss
            patience_counter = 0
            torch.save(model.state_dict(), "best_model.pth")
            print("✨ Validation loss improved. Model saved.")
        else:
            patience_counter += 1
            print(f"🛑 No improvement. Patience counter: {patience_counter}/{patience}")

        if patience_counter >= patience:
            print("\n⚠️ Early stopping triggered.")
            break

    writer.close()  # 👈 Don’t forget this!


# Initialize the model
num_classes = len(label_encoder.classes_)  # Based on the dataset

model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)  # Modern PyTorch
model.fc = nn.Linear(model.fc.in_features, num_classes)  # Replace classifier
model = model.to(device)

# Compute class weights
class_counts = train_metadata['dx_encoded'].value_counts().sort_index().values
class_weights = 1. / torch.tensor(class_counts, dtype=torch.float)
class_weights = class_weights.to(device)

# Weighted loss
criterion = nn.CrossEntropyLoss()



optimizer = optim.Adam(model.parameters(), lr=0.001)
model_path = "model.pth"  # Change if you used a different filename

# if os.path.exists(model_path):
#     model.load_state_dict(torch.load(model_path))
#     print(f"✅ Loaded model from {model_path}")

# Train the model
#train_model(model, train_loader, val_loader, criterion, optimizer, num_epochs=30,patience = 5)

# Get predictions and ground truth
# model.eval()
# all_preds = []
# all_labels = []
# with torch.no_grad():
#     for images, labels in val_loader:
#         images, labels = images.to(device), labels.to(device)
#         outputs = model(images)
#         _,predicted = torch.max(outputs, 1)
#         all_preds.extend(predicted.cpu().numpy())
#         all_labels.extend(labels.cpu().numpy())

# Generate a classification report
# print(classification_report(all_labels, all_preds, target_names=label_encoder.classes_))


from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt


def generate_confusion_matrix():
    # Initialize model (same architecture as training)
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 7)  # Must match your num_classes

    # Load weights
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.load_state_dict(torch.load("best_model.pth", map_location=device))
    model.eval()

    # Load just what we need
    from ai_model.skin_cancer_dataset import val_loader, label_encoder

    # Generate predictions
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    # Create confusion matrix
    plt.figure(figsize=(10, 8))
    cm = confusion_matrix(all_labels, all_preds, normalize='true')
    disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                                  display_labels=label_encoder.classes_)
    disp.plot(cmap='Blues', values_format='.2f', xticks_rotation=45)
    plt.tight_layout()
    plt.savefig('confusion_matrix.pdf')
    print("Confusion matrix saved!")


generate_confusion_matrix()