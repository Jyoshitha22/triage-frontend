
"""Run with:  python3 test_logic.py   (no packages needed)"""
from types import SimpleNamespace as NS
from triage import classify
from routing import visible_to_doctor
from textutil import split_text

def doc(i, dept, years, avail=True, active=True):
    return NS(doctor_id=i, department=dept, experience_years=years, is_available=avail, is_active=active)

def rec(dept, urg):
    return NS(department=dept, urgency=urg)

fails = 0
def check(name, cond):
    global fails
    print(("PASS  " if cond else "FAIL  ") + name)
    if not cond: fails += 1

# ---- triage ----
check("chest pain -> emergency + Cardiologist", classify("I have severe chest pain and sweating", 45) == ("emergency", "Cardiologist"))
check("lower right abdomen -> emergency + Surgeon", classify("Sharp pain in the lower right abdomen since this morning", 34) == ("emergency", "General Surgeon"))
check("fever + headache -> medium + Physician", classify("Headache and mild fever since yesterday", 29) == ("medium", "General Physician"))
check("cough + sore throat -> low + Physician", classify("Cough and sore throat for two days", 30) == ("low", "General Physician"))
check("child always -> Pediatrician", classify("cough and cold", 6) == ("low", "Pediatrician"))
check("missed period -> Gynecologist", classify("Missed period and cramping for a week", 27)[1] == "Gynecologist")
check("skin rash -> Dermatologist", classify("Itchy rash on my arms", 30)[1] == "Dermatologist")
check("empty text -> low + Physician", classify("", None) == ("low", "General Physician"))

# ---- routing ----
cardio = doc(1, "Cardiologist", 10)
gyne   = doc(2, "Gynecologist", 6)
junior = doc(3, "General Physician", 2)
senior = doc(4, "Neurologist", 15)
everyone = [cardio, gyne, junior, senior]

check("cardio sees cardio patient", visible_to_doctor(cardio, rec("Cardiologist", "emergency"), everyone) == (True, None))
check("gyne does NOT see cardio patient while cardio on duty", visible_to_doctor(gyne, rec("Cardiologist", "emergency"), everyone)[0] is False)
check("junior does NOT see cardio patient while cardio on duty", visible_to_doctor(junior, rec("Cardiologist", "low"), everyone)[0] is False)

cardio_off = doc(1, "Cardiologist", 10, avail=False)
team = [cardio_off, gyne, junior, senior]
v, note = visible_to_doctor(senior, rec("Cardiologist", "emergency"), team)
check("cardio off duty + emergency -> senior doctor gets it (with note)", v is True and note is not None)
check("cardio off duty + emergency -> junior does NOT get it", visible_to_doctor(junior, rec("Cardiologist", "emergency"), team)[0] is False)
v, note = visible_to_doctor(junior, rec("Cardiologist", "low"), team)
check("cardio off duty + low -> junior doctor gets it", v is True and note is not None)
check("cardio off duty + low -> senior does NOT get it", visible_to_doctor(senior, rec("Cardiologist", "low"), team)[0] is False)

only_juniors = [cardio_off, junior]
v, note = visible_to_doctor(junior, rec("Cardiologist", "emergency"), only_juniors)
check("emergency, no senior on duty -> anyone on duty may reply", v is True and "any available" in note)
check("off-duty doctor sees nothing via fallback", visible_to_doctor(doc(9, "X", 1, avail=False), rec("Cardiologist", "low"), team)[0] is False)
resigned = doc(1, "Cardiologist", 10, active=False)
check("resigned cardiologist doesn't count as 'on duty'", visible_to_doctor(junior, rec("Cardiologist", "low"), [resigned, junior])[0] is True)

# ---- split_text ----
long_text = ". ".join(["This is sentence number %d" % i for i in range(200)]) + "."
chunks = split_text(long_text, 900)
check("split_text: every chunk <= 900 chars", all(len(c) <= 900 for c in chunks))
check("split_text: no text lost", "".join(chunks).replace(" ", "") == long_text.replace(" ", ""))
check("split_text: short text untouched", split_text("hello") == ["hello"])
check("split_text: empty -> []", split_text("  ") == [])

print("\n%d failure(s)" % fails)
raise SystemExit(1 if fails else 0)