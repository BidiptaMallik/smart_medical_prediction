
from datetime import datetime, timedelta

from app import settings


SPECIALTY_BY_DISEASE = {
    "Atelectasis": ["Pulmonologist"],
    "Cardiomegaly": ["Cardiologist"],
    "Effusion": ["Pulmonologist", "Cardiologist"],
    "Infiltration": ["Pulmonologist", "Infectious Disease Specialist"],
    "Mass": ["Thoracic Oncologist", "Pulmonologist"],
    "Nodule": ["Pulmonologist", "Thoracic Oncologist"],
    "Pneumonia": ["Pulmonologist", "Infectious Disease Specialist"],
    "Pneumothorax": ["Thoracic Surgeon", "Pulmonologist"],
    "Consolidation": ["Pulmonologist", "Infectious Disease Specialist"],
    "Edema": ["Cardiologist", "Pulmonologist"],
    "Emphysema": ["Pulmonologist"],
    "Fibrosis": ["Pulmonologist"],
    "Pleural_Thickening": ["Pulmonologist", "Thoracic Surgeon"],
    "Hernia": ["Thoracic Surgeon", "General Physician"],
}
FALLBACK_SPECIALTIES = ["General Physician", "Radiologist"]

_HOURS_AM = ["09:00", "09:30", "10:00", "10:30", "11:00"]
_HOURS_PM = ["14:00", "14:30", "15:00", "15:30"]

DOCTORS = [
    {"id": "d01", "name": "Dr. Anika Rao", "specialty": "Pulmonologist", "hospital": "Riverside Chest Institute",
     "experience_years": 14, "languages": ["English", "Hindi"], "email": "anika.rao@example.com",
     "days": [0, 1, 3], "hours": _HOURS_AM + _HOURS_PM},
    {"id": "d02", "name": "Dr. Marcus Feld", "specialty": "Pulmonologist", "hospital": "Lakeside Respiratory Clinic",
     "experience_years": 9, "languages": ["English"], "email": "marcus.feld@example.com",
     "days": [2, 4], "hours": _HOURS_PM + ["16:00", "16:30"]},
    {"id": "d03", "name": "Dr. Priya Nair", "specialty": "Cardiologist", "hospital": "Meridian Heart Centre",
     "experience_years": 17, "languages": ["English", "Hindi", "Malayalam"], "email": "priya.nair@example.com",
     "days": [0, 2, 4], "hours": _HOURS_AM},
    {"id": "d04", "name": "Dr. Samuel Okafor", "specialty": "Thoracic Oncologist", "hospital": "Northgate Cancer Institute",
     "experience_years": 12, "languages": ["English", "French"], "email": "samuel.okafor@example.com",
     "days": [1, 3], "hours": _HOURS_AM + _HOURS_PM[:2]},
    {"id": "d05", "name": "Dr. Helena Voss", "specialty": "Thoracic Surgeon", "hospital": "St. Aldric Surgical Hospital",
     "experience_years": 20, "languages": ["English", "German"], "email": "helena.voss@example.com",
     "days": [0, 1, 2, 3, 4], "hours": ["08:30", "09:00", "13:00", "13:30"]},
    {"id": "d06", "name": "Dr. Ravi Menon", "specialty": "Infectious Disease Specialist", "hospital": "Riverside Chest Institute",
     "experience_years": 11, "languages": ["English", "Hindi", "Tamil"], "email": "ravi.menon@example.com",
     "days": [1, 2, 4], "hours": _HOURS_AM[:3] + _HOURS_PM},
    {"id": "d07", "name": "Dr. Lucía Ortega", "specialty": "Radiologist", "hospital": "Meridian Imaging Centre",
     "experience_years": 15, "languages": ["English", "Spanish"], "email": "lucia.ortega@example.com",
     "days": [0, 1, 2, 3, 4], "hours": _HOURS_AM + _HOURS_PM},
    {"id": "d08", "name": "Dr. Tomas Brandt", "specialty": "General Physician", "hospital": "Elm Street Family Practice",
     "experience_years": 8, "languages": ["English", "German"], "email": "tomas.brandt@example.com",
     "days": [0, 1, 2, 3, 4, 5], "hours": _HOURS_AM + _HOURS_PM},
]


def get(doctor_id):
    return next((d for d in DOCTORS if d["id"] == doctor_id), None)


def treats(doctor):
    if doctor["specialty"] == "Radiologist":  
        return list(SPECIALTY_BY_DISEASE)
    return [dis for dis, specs in SPECIALTY_BY_DISEASE.items() if doctor["specialty"] in specs]


def public(doctor):

    return {k: doctor[k] for k in ("id", "name", "specialty", "hospital", "experience_years", "languages")} | {
        "treats": treats(doctor)}


def recommend(predictions):
    ranked = sorted(predictions, key=lambda p: p["probability"], reverse=True)
    strongest = ranked[:1]

    scores, matched = {}, {}
    for p in strongest:
        if p["probability"] < settings.RECOMMEND_THRESHOLD:
            continue
        for i, spec in enumerate(SPECIALTY_BY_DISEASE.get(p["pathology"], [])):
            weight = 1.0 if i == 0 else 0.6
            for d in DOCTORS:
                if d["specialty"] == spec:
                    scores[d["id"]] = scores.get(d["id"], 0) + p["probability"] * weight
                    matched.setdefault(d["id"], {})[p["pathology"]] = p["probability"]

    note = None
    if not scores:
        note = (f"No finding reached {round(settings.RECOMMEND_THRESHOLD * 100)}%, so a general review "
                "and a radiologist's read of the film are suggested.")
        for d in DOCTORS:
            if d["specialty"] in FALLBACK_SPECIALTIES:
                scores[d["id"]] = 0.0
                matched[d["id"]] = {}

    order = sorted(scores, key=lambda i: (-scores[i], -get(i)["experience_years"]))[:4]
    docs = [public(get(i)) | {"match_score": round(scores[i], 3),
                              "matched": [{"pathology": k, "probability": v} for k, v in matched[i].items()]}
            for i in order]

    pneumo = next((p["probability"] for p in predictions if p["pathology"] == "Pneumothorax"), 0)
    urgent = pneumo >= settings.URGENT_PNEUMOTHORAX
    return {
        "doctors": docs, "note": note, "urgent": urgent,
        "urgent_message": ("One estimate (Pneumothorax) is high. If you have sudden chest pain or difficulty "
                           "breathing, seek emergency care now instead of waiting for an appointment.") if urgent else None,
    }


def open_slots(doctor, booked, days=7, now=None):
    now = now or datetime.now()
    earliest = now + timedelta(hours=2)
    out = []
    for offset in range(days + 1):
        day = (now + timedelta(days=offset)).date()
        if day.weekday() not in doctor["days"]:
            continue
        for hhmm in doctor["hours"]:
            start = datetime.combine(day, datetime.strptime(hhmm, "%H:%M").time())
            iso = start.strftime("%Y-%m-%dT%H:%M")
            if start >= earliest and iso not in booked:
                out.append(iso)
    return out