
"""
Rule-based triage — a clearly-labelled STAND-IN for your BERT/spaCy model.

classify(english_text, age) -> (urgency, department)

It runs on the ENGLISH text (main.py translates Telugu/Hindi/Tamil to
English first). When your real NLP model is ready, replace the body of
classify() — its inputs/outputs stay the same, so nothing else changes.

Urgency:    emergency | medium | low
Department: must match the department names offered in the specialist
            forms (see DEPARTMENTS in the frontend SpecialistDetails.jsx).
"""
import re

EMERGENCY = [
    r"chest (pain|tight|pressure)", r"heart attack", r"can'?t breathe", r"cannot breathe",
    r"(difficulty|trouble|hard to) breath", r"breathing (difficulty|problem)", r"shortness of breath",
    r"breathless", r"unconscious", r"fainted", r"passed out", r"seizure", r"convuls",
    r"severe bleeding", r"heavy bleeding", r"bleeding (a lot|heavily)", r"\bstroke\b", r"paralys",
    r"face (is )?droop", r"slurred speech", r"poison", r"overdose", r"suicid", r"snake ?bite",
    r"chok(e|ing)", r"blood in (the )?(vomit|stool)", r"vomiting blood", r"coughing (up )?blood",
    r"severe (abdominal|stomach|belly) pain", r"lower right (abdomen|belly)", r"head injury",
]
MEDIUM = [
    r"fever", r"vomit", r"diarrh", r"infection", r"fractur", r"broken", r"swelling", r"swollen",
    r"dizz", r"severe", r"blood", r"dehydrat", r"wheez", r"burning", r"\bpain\b", r"not able to eat",
    r"pregnan", r"missed period",
]

# Order matters: first match wins.
DEPARTMENTS = [
    ("Gynecologist", [r"pregnan", r"\bperiods?\b", r"menstrua", r"vaginal", r"uterus", r"\bpcos\b", r"\bpcod\b",
                      r"ovar", r"breast lump", r"white discharge", r"missed period"]),
    ("Cardiologist", [r"chest (pain|tight|pressure)", r"palpitation", r"\bheart\b", r"shortness of breath",
                      r"breathless", r"blood pressure", r"\bbp\b"]),
    ("Neurologist", [r"seizure", r"convuls", r"\bstroke\b", r"paralys", r"numb", r"migraine",
                     r"slurred", r"severe headache", r"memory loss"]),
    ("Orthopedic", [r"fractur", r"broken (bone|arm|leg)", r"\bjoint", r"\bknee", r"back pain", r"sprain",
                    r"shoulder", r"neck pain", r"\bbone"]),
    ("Dermatologist", [r"\bskin\b", r"\brash", r"itch", r"acne", r"eczema", r"hives", r"fungal", r"hair loss"]),
    ("Dentist", [r"tooth", r"teeth", r"\bgums?\b", r"dental", r"toothache"]),
    ("General Surgeon", [r"abdom", r"appendix", r"hernia", r"gallstone", r"lower right", r"\bwound\b", r"deep cut"]),
]


def _any(patterns, text):
    return any(re.search(p, text, re.I) for p in patterns)


def classify(text_en: str, age=None):
    text = (text_en or "").lower()

    if _any(EMERGENCY, text):
        urgency = "emergency"
    elif _any(MEDIUM, text):
        urgency = "medium"
    else:
        urgency = "low"

    # Children go to a pediatrician regardless of complaint.
    if age is not None and 0 < age <= 12:
        return urgency, "Pediatrician"

    for dept, patterns in DEPARTMENTS:
        if _any(patterns, text):
            return urgency, dept
    return urgency, "General Physician"


# Curated list for dropdowns (specialist registration, hospital setup).
DEPARTMENT_OPTIONS = [d for d, _ in DEPARTMENTS] + ["General Physician", "Pediatrician"]