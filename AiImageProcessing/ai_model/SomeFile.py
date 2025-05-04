import pandas as pd

csv_path = r"C:\Users\ioan1\.cache\kagglehub\datasets\kmader\skin-cancer-mnist-ham10000\versions\2\HAM10000_metadata.csv"
df = pd.read_csv(csv_path)

counts = df['dx'].value_counts()  # 'dx' column contains the class labels

print("Class Frequencies:")
print(counts)
