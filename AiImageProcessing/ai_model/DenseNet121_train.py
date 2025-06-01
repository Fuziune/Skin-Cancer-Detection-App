import os
import pickle
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms, models
from torch.utils.tensorboard import SummaryWriter
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score
import numpy as np
from skin_cancer_dataset import SkinCancerDataset, train_metadata, val_metadata, label_encoder, train_transforms, val_transforms, device

# Parameters
num_classes = len(label_encoder.classes_)
model_save_path = "best_model_densenet.pth"

def train_model(model, train_loader, val_loader, criterion, optimizer, num_epochs=30, patience=5):
    best_loss = float('inf')
    patience_counter = 0
    writer = SummaryWriter(log_dir="runs/densenet_skin_cancer")

    for epoch in range(num_epochs):
        print(f"\nEpoch {epoch + 1}/{num_epochs}")

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

        # Validation
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

        writer.add_scalar("Loss/train", train_loss, epoch)
        writer.add_scalar("Loss/val", avg_val_loss, epoch)
        writer.add_scalar("Accuracy/val", accuracy, epoch)
        writer.add_scalar("F1_score/val", f1, epoch)

        if avg_val_loss < best_loss:
            best_loss = avg_val_loss
            patience_counter = 0
            torch.save(model.state_dict(), model_save_path)
            print("✨ Validation loss improved. Model saved.")
        else:
            patience_counter += 1
            print(f"🛑 No improvement. Patience counter: {patience_counter}/{patience}")

        if patience_counter >= patience:
            print("\n⚠️ Early stopping triggered.")
            break

    writer.close()

if __name__ == '__main__':
    model = models.densenet121(weights=models.DenseNet121_Weights.IMAGENET1K_V1)
    model.classifier = nn.Linear(model.classifier.in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    train_dataset = SkinCancerDataset(train_metadata, transform=train_transforms)
    val_dataset = SkinCancerDataset(val_metadata, transform=val_transforms)

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

    train_model(model, train_loader, val_loader, criterion, optimizer, num_epochs=30, patience=5)
