🧬 Mole Cancer Detector

A cross-platform mobile application and backend system for skin cancer detection using deep learning. Users can upload photos of moles, receive AI-powered diagnoses, and store reports securely. Built with React Native (Expo) and FastAPI, powered by a ResNet18 model trained on the HAM10000 dataset.

📱 Features
🔍 Real-time mole analysis using AI

📊 Visual diagnostic reports with class probabilities

📷 Upload or take a photo of the lesion

🧠 ResNet18 deep learning model trained on HAM10000

🗃️ View and manage diagnostic history

👤 Secure authentication and role-based access

💾 Local and server-side report storage

⚠️ Visual recommendations per diagnosis type

🖼️ App Screenshots:

![HomeScreen] (C:\Users\ioan1\Desktop\Licenta\MoleCancerDetector\assets\images\home_tab.jpg)
![Diagnostic] (C:\Users\ioan1\Desktop\Licenta\MoleCancerDetector\assets\images\diagnostic_result1.jpg)
![Diagnostic_graphic] (C:\Users\ioan1\Desktop\Licenta\MoleCancerDetector\assets\images\diagnostic_result_bottom.png)

⚙️ Tech Stack
Frontend (React Native + Expo)
expo-router for navigation

react-native-chart-kit for probability charts

Secure login/logout with JWT tokens

AsyncStorage for local persistence

Backend (FastAPI)
User registration, authentication (OAuth2 with JWT)

Image upload and classification endpoints

Diagnostic report storage in SQLite (via SQLAlchemy)

AI integration with PyTorch ResNet18

Machine Learning
ResNet18 fine-tuned on HAM10000 dataset

Supports diagnosis of:

Melanoma (mel)

Basal Cell Carcinoma (bcc)

Benign Keratosis (bkl)

Dermatofibroma (df)

Vascular Lesions (vasc)

Actinic Keratosis (akiec)

Nevus (nv)

🚀 Getting Started
Backend
bash
Copy
Edit
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
Ensure label_encoder.pkl and best_model.pth are available in ai_model/.

Frontend
bash
Copy
Edit
cd frontend
npm install
npx expo start
Update the API_URL in config.ts to match your backend.

🔐 Authentication
User roles: patient, doctor, admin

Registration and login handled via FastAPI routes (/auth/register, /auth/login)

JWT tokens used to protect diagnostic endpoints

📂 Folder Structure
Copy
Edit
├── backend
│   ├── app
│   ├── ai_model
│   ├── databases
│   ├── model
│   ├── services
│   ├── repo
├── frontend
│   ├── components
│   ├── screens
│   ├── context
│   ├── services
🧪 Sample Workflow
User selects or captures an image

Image is encoded and sent to the FastAPI /get_diagnosis endpoint

AI model returns probabilities and diagnosis

User can view bar chart, recommendations, and optionally save the result

Saved diagnostics are shown in the Diagnostics tab

⚠️ Disclaimer
This application is intended for educational purposes and should not replace professional medical advice. For any skin condition concerns, please consult a dermatologist.

👤 Author
Built by Ioan Istrate as part of a Bachelor’s thesis on AI-powered dermatological diagnosis.
