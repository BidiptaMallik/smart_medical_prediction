import io
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

from app.config import MODEL_PATH, PATHOLOGIES, IMAGE_SIZE, NORMALIZE_MEAN, NORMALIZE_STD

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

_transform = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=NORMALIZE_MEAN, std=NORMALIZE_STD),
])


def load_model() -> nn.Module:
    model = torch.load(MODEL_PATH, map_location=device, weights_only=False)
    model.to(device)
    model.eval()
    return model


model = load_model()


def predict_from_bytes(image_bytes: bytes) -> list[dict]:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = _transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.sigmoid(outputs).cpu().numpy()[0]

    results = [
        {"pathology": pathology, "probability": round(float(prob), 4)}
        for pathology, prob in zip(PATHOLOGIES, probabilities)
    ]
    results.sort(key=lambda x: x["probability"], reverse=True)
    return results