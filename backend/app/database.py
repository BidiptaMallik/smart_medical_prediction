
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime

from app import settings


class SlotTakenError(Exception):
    pass


@contextmanager
def _db():
    os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id TEXT NOT NULL,
        slot_start TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_email TEXT NOT NULL,
        report_text TEXT DEFAULT '',
        ai_generated INTEGER DEFAULT 0,
        status TEXT DEFAULT 'booked',
        created_at TEXT NOT NULL,
        UNIQUE (doctor_id, slot_start))""")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def booked_slots(doctor_id):
    with _db() as conn:
        rows = conn.execute("SELECT slot_start FROM appointments WHERE doctor_id=? AND status='booked'",
                            (doctor_id,)).fetchall()
    return {r["slot_start"] for r in rows}


def create_appointment(doctor_id, slot_start, patient_name, patient_email):
    try:
        with _db() as conn:
            cur = conn.execute(
                "INSERT INTO appointments (doctor_id, slot_start, patient_name, patient_email, created_at) "
                "VALUES (?,?,?,?,?)",
                (doctor_id, slot_start, patient_name, patient_email, datetime.now().isoformat(timespec="seconds")))
            return cur.lastrowid
    except sqlite3.IntegrityError:
        raise SlotTakenError()


def save_report(appointment_id, text, ai_generated):
    with _db() as conn:
        conn.execute("UPDATE appointments SET report_text=?, ai_generated=? WHERE id=?",
                     (text, int(ai_generated), appointment_id))