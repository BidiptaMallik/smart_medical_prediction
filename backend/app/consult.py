import re
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator

from app import database, doctors, notifications, report, settings

router = APIRouter(tags=["consultation"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MAX_IMAGE_BYTES = 10 * 1024 * 1024
EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


class PredIn(BaseModel):
    pathology: str
    probability: float = Field(ge=0, le=1)


class RecommendIn(BaseModel):
    predictions: list[PredIn]


class Patient(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=0, le=120)
    sex: str = Field(default="unspecified", max_length=20)
    email: str = Field(max_length=200)
    phone: str = Field(default="", max_length=30)
    symptoms: str = Field(default="", max_length=1000)

    @field_validator("email")
    @classmethod
    def valid_email(cls, v):
        if not EMAIL_RE.match(v):
            raise ValueError("invalid email address")
        return v


class ConsultIn(BaseModel):
    patient: Patient
    consent: bool
    doctor_id: str
    slot_start: str
    predictions: list[PredIn]


@router.get("/doctors")
def list_doctors():
    return {"doctors": [doctors.public(d) for d in doctors.DOCTORS]}


@router.get("/specialties")
def specialties():
    return {"specialty_by_disease": doctors.SPECIALTY_BY_DISEASE}


@router.post("/doctors/recommend")
def recommend(body: RecommendIn):
    return doctors.recommend([p.model_dump() for p in body.predictions])


@router.get("/doctors/{doctor_id}/slots")
def slots(doctor_id: str):
    doc = doctors.get(doctor_id)
    if not doc:
        raise HTTPException(404, "Doctor not found")
    return {"doctor_id": doctor_id, "slots": doctors.open_slots(doc, database.booked_slots(doctor_id))}


@router.post("/consult")
async def consult(payload: str = Form(...), image: Optional[UploadFile] = File(None)):
    try:
        data = ConsultIn.model_validate_json(payload)
    except Exception as e:
        raise HTTPException(422, f"Invalid request: {e}")
    if not data.consent:
        raise HTTPException(400, "Patient consent is required before anything is shared.")
    doc = doctors.get(data.doctor_id)
    if not doc:
        raise HTTPException(404, "Doctor not found")

    attachments = []
    if image is not None:
        ctype = image.content_type or ""
        if ctype not in EXT:
            raise HTTPException(400, "Attachment must be a JPEG, PNG or WebP image")
        image_bytes = await image.read()
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(413, "Image too large (max 10 MB)")
        attachments = [(f"chest_xray.{EXT[ctype]}", image_bytes, ctype)]

    if data.slot_start not in doctors.open_slots(doc, database.booked_slots(doc["id"])):
        raise HTTPException(409, "That time slot is no longer available. Please pick another.")
    try:
        appt_id = database.create_appointment(doc["id"], data.slot_start, data.patient.name, data.patient.email)
    except database.SlotTakenError:
        raise HTTPException(409, "That time slot was just taken. Please pick another.")

    patient = data.patient.model_dump()
    preds = [p.model_dump() for p in data.predictions]
    text, ai = await run_in_threadpool(report.generate_report, patient, preds, doc, data.slot_start)
    database.save_report(appt_id, text, ai)

    when = datetime.fromisoformat(data.slot_start).strftime("%A, %d %b %Y at %H:%M")
    doctor_to = settings.DOCTOR_EMAIL_OVERRIDE or doc["email"]
    doctor_status = await run_in_threadpool(
        notifications.send_email, doctor_to, f"Referral request - appointment {when}", text, attachments)
    patient_msg = (f"Hi {data.patient.name},\n\nYour appointment request is booked.\n\n"
                   f"Doctor: {doc['name']} ({doc['specialty']}), {doc['hospital']}\nWhen: {when}\n\n"
                   "The referral summary you approved has been sent to the doctor.\n\n"
                   "If you have sudden chest pain or trouble breathing, seek emergency care instead of waiting.")
    patient_status = await run_in_threadpool(
        notifications.send_email, data.patient.email, "Your appointment is booked", patient_msg)

    return {"appointment_id": appt_id, "doctor": doctors.public(doc), "slot_start": data.slot_start,
            "report": text, "ai_generated": ai,
            "delivery": {"doctor": doctor_status, "patient": patient_status,
                         "image_attached": bool(attachments)}}