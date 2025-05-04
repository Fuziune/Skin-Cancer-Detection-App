import sys
# Block all execution from the imported file
sys.modules['__main__'].__file__ = 'plots_saves.py'

import torch
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
import numpy as np

# Now safely import
from ai_model.skin_cancer_dataset import val_loader, label_encoder, device


def load_essentials():
    """Safely imports only what we need"""
    from ai_model.skin_cancer_dataset import (  # Local import
        val_loader,
        label_encoder,
        device
    )
    return val_loader, label_encoder, device


def generate_plots():
    val_loader, label_encoder, device = load_essentials()

    # Load model
    model = torch.load("best_model.pth", map_location=device)
    model.eval()

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

    # Confusion matrix
    plt.figure(figsize=(10, 8), dpi=300)
    cm = confusion_matrix(all_labels, all_preds, normalize='true')
    disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                                  display_labels=label_encoder.classes_)
    disp.plot(cmap='Blues', values_format='.2f', xticks_rotation=45)
    plt.tight_layout()
    plt.savefig('confusion_matrix.pdf', bbox_inches='tight')
    plt.close()
    print("Successfully generated confusion_matrix.pdf")


if __name__ == '__main__':
    generate_plots()