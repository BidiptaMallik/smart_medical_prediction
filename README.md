# Chest X-ray Disease Prediction System

A full-stack deep learning application that estimates the likelihood of 14 common chest conditions from a chest X-ray image. Upload a frontal chest X-ray, and the system returns a ranked, multi-label probability score for each condition using a fine-tuned DenseNet121.

> **Research prototype — not a diagnostic tool.** Trained on a small public sample (5,606 images). Predictions reflect pattern similarity to training data and have not been validated against radiologist-confirmed diagnoses. Not for clinical or real-world medical use.

## Features
- Multi-label chest X-ray classification (14 pathology classes, images can show more than one at once)
- DenseNet121 CNN, ImageNet-pretrained, fine-tuned with a partially unfrozen backbone
- Class-imbalance-aware training (weighted loss) and early stopping on validation AUROC
- React-based frontend for image upload and animated result display
- Python backend serving real-time model predictions via API
- Clean, responsive UI with per-finding probability breakdown
- Optional local Ollama assistant with streamed responses and current scan context
- Structured chest radiograph report draft with required-fact validation and a template fallback
- Sample specialist matching, appointment booking, and report delivery/outbox support

## Tech Stack

**Machine Learning**
- PyTorch / Torchvision
- DenseNet121 (ImageNet-pretrained backbone)
- NIH ChestX-ray14 (sample subset)

**Backend**
- Python
- FastAPI
- Uvicorn
- Ollama (optional, for local AI chat and report generation)

**Frontend**
- React.js
- JavaScript
- Vite

**Training Environment**
- Google Colab (GPU runtime)

## Folder Structure
```
chexray_project/
├── backend/
│   └── app/
│       ├── main.py
│       ├── model.py
│       ├── config.py
│       └── models/
│           └── best_model.pth
├── chexray-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── pathologies.js
│   ├── package.json
│   └── vite.config.js
├── requirements.txt
├── setup.py
└── README.md
```

## Installation

Clone the repository
```bash
git clone https://github.com/BidiptaMallik/chexray_project.git
cd chexray_project
```

Backend setup
```bash
python -m venv venv
venv\Scripts\activate      # Windows
pip install -e .
cd backend
uvicorn app.main:app --reload
```

### Optional Ollama Setup

Install and start [Ollama](https://ollama.com/), then download a chat-capable model:
```bash
ollama pull llama3.2:3b
```

Create `backend/.env` to enable local AI chat and report generation:
```env
REPORT_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT=120
```

Restart the backend after changing `.env`. Ollama runs locally and does not need an API key. If Ollama is not configured or a report draft omits required details, report generation falls back to the structured template. Chat requires Ollama to be available.

The report generator receives patient-provided details and model scores, not the X-ray itself. Its structured draft therefore marks image anatomy as not assessed and treats scores as model estimates, not radiologist findings. Missing patient ID, examination date, or technique are shown as not provided.

Frontend setup
```bash
cd chexray-frontend
npm install
npm run dev
```

The dashboard includes an assistant that streams replies from the configured Ollama model and can use the current scan scores as context. Emergency and self-harm keyword checks return fixed safety guidance before a message is sent to the model.

The specialist profiles are fictional demo data. When SMTP is not configured, appointment emails are saved as `.eml` files in `backend/outbox/` instead of being sent.

## How It Works
```
Upload Chest X-ray
        ↓
Image Preprocessing (resize to 224×224, normalize)
        ↓
DenseNet121 Inference (PyTorch)
        ↓
Per-Class Sigmoid Probabilities (14 independent scores)
        ↓
Ranked Results Displayed on Frontend
```

## Model Performance

| Metric | Value |
|---|---|
| Mean Validation AUROC | ~0.74 |
| Number of Classes | 14 |
| Training Images | 4,462 (patient-level split) |
| Best Epoch | Selected via early stopping |
| Architecture | DenseNet121 (classifier + final dense block fine-tuned) |

Per-class performance varies significantly — strong classes (Emphysema, Edema, Effusion) reach AUROC ~0.75–0.85; weak, data-starved classes (Fibrosis, Pneumonia, Cardiomegaly) sit closer to ~0.55–0.65, only modestly above random guessing (0.50). This is expected given severe class imbalance in the training sample (13–967 positive examples per class) and is reported here rather than hidden.

## Limitations
- Trained on a small subset (5,606 images) of a larger public dataset; real deployed tools use 100,000+ radiologist-verified images
- Labels are NLP-mined from radiology reports, not per-image radiologist-confirmed
- No external validation on data from other hospitals/scanners
- Not reviewed by a clinician, not regulatory-cleared, not intended for real diagnostic use

## Author
Bidipta Mallik — GitHub