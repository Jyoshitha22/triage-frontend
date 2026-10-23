
"""
Who is allowed to see which waiting patient — the rules you described:

  1. A patient always goes first to their matching specialist
     (cardiology patient -> cardiologists).
  2. If NO doctor of that department is on duty:
        - serious (emergency)  -> experienced doctors (>= SENIOR_YEARS)
        - anything else        -> less-experienced doctors (< SENIOR_YEARS)
  3. If nobody of the preferred seniority is on duty either
        -> ANY doctor on duty may take it.

Pure functions, no database imports, so they're unit-tested on their own.
`doctor` and `record` are any objects with the attributes used below.
"""
SENIOR_YEARS = 5


def _on_duty(d):
    return getattr(d, "is_active", True) is not False and getattr(d, "is_available", True) is not False


def visible_to_doctor(doctor, record, all_doctors):
    """Returns (visible: bool, note: str | None). The note is shown to the doctor
    when a patient reaches them through the fallback rules."""
    dept = record.department
    if (doctor.department or "") == (dept or ""):
        return True, None
    if not _on_duty(doctor):
        return False, None

    specialists_on_duty = [d for d in all_doctors if _on_duty(d) and (d.department or "") == (dept or "")]
    if specialists_on_duty:
        return False, None   # a real specialist is on duty — it's theirs

    wants_senior = record.urgency == "emergency"

    def right_tier(d):
        years = d.experience_years or 0
        return years >= SENIOR_YEARS if wants_senior else years < SENIOR_YEARS

    tier = [d for d in all_doctors if _on_duty(d) and right_tier(d)]
    if tier:
        if any(d.doctor_id == doctor.doctor_id for d in tier):
            who = "an experienced doctor" if wants_senior else "a general/junior doctor"
            return True, f"No {dept} on duty — routed to {who}"
        return False, None

    return True, f"No {dept} or preferred-level doctor on duty — any available doctor can reply"