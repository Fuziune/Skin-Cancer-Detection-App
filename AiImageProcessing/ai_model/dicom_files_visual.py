import os
import pydicom
import matplotlib.pyplot as plt

# Enable interactive mode for plotting (useful for some environments)
#plt.ion()

dicom_folder = r"C:\Users\ioan1\Desktop\isic mole dataset\ISIC_2020_Train_DICOM_corrected\train"

# Loop through all DICOM files in the folder
for filename in os.listdir(dicom_folder):
    if filename.endswith(".dcm"):
        dicom_path = os.path.join(dicom_folder, filename)

        try:
            # Load DICOM file
            ds = pydicom.dcmread(dicom_path)

            # Decompress if needed
            if ds.file_meta.TransferSyntaxUID.is_compressed:
                ds.decompress()

            # Print Metadata (Extract Important Fields)
            print(f"\n--- Metadata for {filename} ---")
            print(f"Patient ID: {ds.get('PatientID', 'N/A')}")
            print(f"Patient Age: {ds.get('PatientAge', 'N/A')}")
            print(f"Patient Sex: {ds.get('PatientSex', 'N/A')}")
            print(f"Modality: {ds.get('Modality', 'N/A')}")
            print(f"Study Date: {ds.get('StudyDate', 'N/A')}")
            print(f"Image Size: {ds.Rows} x {ds.Columns}")
            print(f"Bits Stored: {ds.get('BitsStored', 'N/A')}")
            print(f"Photometric Interpretation: {ds.get('PhotometricInterpretation', 'N/A')}")
            print(f"Pixel Spacing: {ds.get('PixelSpacing', 'N/A')}")

            # Check if pixel data exists
            if hasattr(ds, "pixel_array"):
                image = ds.pixel_array

                # Plot the image
                plt.figure(figsize=(6, 6))
                plt.imshow(image, cmap="gray")
                plt.title(f"File: {filename}")
                plt.axis("off")
                plt.show(block=True)  # Forces the image to stay open
                break

            else:
                print(f"Skipping {filename} (No image data)")

        except Exception as e:
            print(f"Error loading {filename}: {e}")
