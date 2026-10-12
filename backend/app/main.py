from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.consult import router as consult_router
from app.chat import router as chat_router

from app.model import predict_from_bytes
from app.config import PATHOLOGIES

app = FastAPI(title="Chest X-ray Disease Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(consult_router)
app.include_router(chat_router)

class Prediction(BaseModel):
    pathology: str
    probability: float


class PredictionResponse(BaseModel):
    predictions: list[Prediction]
    top_finding: str


@app.get("/")
def root():
    return {"status": "ok", "message": "Chest X-ray prediction API is running"}


@app.get("/health")
def health():
    return {"status": "healthy", "pathologies_supported": PATHOLOGIES}


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_bytes = await file.read()
        results = predict_from_bytes(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {str(e)}")

    return PredictionResponse(
        predictions=results,
        top_finding=results[0]["pathology"],
    )