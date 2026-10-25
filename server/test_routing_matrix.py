import unittest

from server.main import infer_department, normalize_department_name


class RoutingMatrixTests(unittest.TestCase):
    def test_general_physician_for_fever_cold_cluster(self):
        text = "I have fever, cold, runny nose, sore throat and body pain"
        self.assertEqual(infer_department(text), "General Physician")

    def test_cardiology_for_clear_heart_symptoms(self):
        text = "Severe chest pain with palpitations and left arm pain"
        self.assertEqual(infer_department(text), "Cardiologist")

    def test_dermatology_for_skin_symptoms(self):
        text = "Skin rash with itching and red patches for three days"
        self.assertEqual(infer_department(text), "Dermatologist")

    def test_fallback_to_general_when_no_specialist_signal(self):
        text = "I feel tired and weak with mild fever"
        self.assertEqual(infer_department(text), "General Physician")

    def test_department_alias_normalization(self):
        self.assertEqual(normalize_department_name("gp"), "General Physician")
        self.assertEqual(normalize_department_name("general doctor"), "General Physician")
        self.assertEqual(normalize_department_name("cadiologist"), "Cardiologist")
        self.assertEqual(normalize_department_name("orthopedic"), "Orthopaedician")


if __name__ == "__main__":
    unittest.main()
