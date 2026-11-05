import unittest

from server.main import classify_symptom_text


class SymptomValidationMultilingualTests(unittest.TestCase):
    def assert_category(self, text: str, language: str, expected: str):
        result = classify_symptom_text(text, language)
        self.assertEqual(
            result["category"],
            expected,
            msg=f"Input={text!r} lang={language} expected={expected} got={result}",
        )

    def test_english_matrix(self):
        cases = [
            ("My heart sank in water", "NON_MEDICAL"),
            ("I have heart pain", "PERSONAL_SYMPTOM"),
            ("My heart is beating very fast", "PERSONAL_SYMPTOM"),
            ("I saw a heart in a picture", "NON_MEDICAL"),
            ("I want to learn about the heart", "GENERAL_MEDICAL_INFORMATION"),
            ("I don't have fever", "NEGATED_SYMPTOM"),
            ("I had fever yesterday", "PAST_SYMPTOM"),
            ("My friend has fever", "OTHER_PERSON_SYMPTOM"),
            ("My stomach hurts", "PERSONAL_SYMPTOM"),
            ("I have severe chest pain", "EMERGENCY"),
            ("I am unable to breathe", "EMERGENCY"),
            ("Hello", "NON_MEDICAL"),
            ("I want to buy a mobile", "NON_MEDICAL"),
            ("asdfghjkl", "NON_MEDICAL"),
            ("Feeling dizzy", "PERSONAL_SYMPTOM"),
        ]
        for text, expected in cases:
            with self.subTest(text=text, expected=expected):
                self.assert_category(text, "en", expected)

    def test_telugu_matrix(self):
        cases = [
            ("నీళ్లలో నా గుండె మునిగింది", "NON_MEDICAL"),
            ("నాకు గుండె నొప్పి ఉంది", "PERSONAL_SYMPTOM"),
            ("నా గుండె చాలా వేగంగా కొడుతోంది", "PERSONAL_SYMPTOM"),
            ("చిత్రంలో గుండె చూసాను", "NON_MEDICAL"),
            ("గుండె గురించి తెలుసుకోవాలి", "GENERAL_MEDICAL_INFORMATION"),
            ("నాకు జ్వరం లేదు", "NEGATED_SYMPTOM"),
            ("నిన్న నాకు జ్వరం వచ్చింది", "PAST_SYMPTOM"),
            ("నా స్నేహితుడికి జ్వరం ఉంది", "OTHER_PERSON_SYMPTOM"),
            ("నాకు కడుపు నొప్పి ఉంది", "PERSONAL_SYMPTOM"),
            ("నాకు తీవ్రమైన ఛాతి నొప్పి ఉంది", "EMERGENCY"),
            ("నేను శ్వాస తీసుకోలేకపోతున్నాను", "EMERGENCY"),
            ("హలో", "NON_MEDICAL"),
            ("నేను మొబైల్ కొనాలి", "NON_MEDICAL"),
            ("asdfghjkl", "NON_MEDICAL"),
            ("నాకు తల తిరుగుతోంది", "PERSONAL_SYMPTOM"),
        ]
        for text, expected in cases:
            with self.subTest(text=text, expected=expected):
                self.assert_category(text, "te", expected)

    def test_hindi_matrix(self):
        cases = [
            ("पानी में मेरा दिल डूब गया", "NON_MEDICAL"),
            ("मुझे दिल में दर्द है", "PERSONAL_SYMPTOM"),
            ("मेरा दिल बहुत तेज धड़क रहा है", "PERSONAL_SYMPTOM"),
            ("मैंने तस्वीर में दिल देखा", "NON_MEDICAL"),
            ("मैं दिल के बारे में सीखना चाहता हूं", "GENERAL_MEDICAL_INFORMATION"),
            ("मुझे बुखार नहीं है", "NEGATED_SYMPTOM"),
            ("कल मुझे बुखार था", "PAST_SYMPTOM"),
            ("मेरे दोस्त को बुखार है", "OTHER_PERSON_SYMPTOM"),
            ("मेरे पेट में दर्द है", "PERSONAL_SYMPTOM"),
            ("मुझे तेज छाती में दर्द है", "EMERGENCY"),
            ("मैं सांस नहीं ले पा रहा", "EMERGENCY"),
            ("हेलो", "NON_MEDICAL"),
            ("मैं मोबाइल खरीदना चाहता हूं", "NON_MEDICAL"),
            ("asdfghjkl", "NON_MEDICAL"),
            ("मुझे चक्कर आ रहे हैं", "PERSONAL_SYMPTOM"),
        ]
        for text, expected in cases:
            with self.subTest(text=text, expected=expected):
                self.assert_category(text, "hi", expected)

    def test_tamil_matrix(self):
        cases = [
            ("தண்ணீரில் என் இதயம் மூழ்கியது", "NON_MEDICAL"),
            ("எனக்கு இதயம் வலி உள்ளது", "PERSONAL_SYMPTOM"),
            ("என் இதயம் மிக வேகமாக துடிக்கிறது", "PERSONAL_SYMPTOM"),
            ("படத்தில் இதயத்தை பார்த்தேன்", "NON_MEDICAL"),
            ("இதயம் பற்றி கற்க விரும்புகிறேன்", "GENERAL_MEDICAL_INFORMATION"),
            ("எனக்கு காய்ச்சல் இல்லை", "NEGATED_SYMPTOM"),
            ("நேற்று எனக்கு காய்ச்சல் இருந்தது", "PAST_SYMPTOM"),
            ("என் நண்பருக்கு காய்ச்சல் உள்ளது", "OTHER_PERSON_SYMPTOM"),
            ("எனக்கு வயிறு வலி இருக்கிறது", "PERSONAL_SYMPTOM"),
            ("எனக்கு கடுமையான மார்பு வலி உள்ளது", "EMERGENCY"),
            ("எனக்கு மூச்சு விட முடியவில்லை", "EMERGENCY"),
            ("ஹலோ", "NON_MEDICAL"),
            ("நான் மொபைல் வாங்க வேண்டும்", "NON_MEDICAL"),
            ("asdfghjkl", "NON_MEDICAL"),
            ("எனக்கு மயக்கம் வருகிறது", "PERSONAL_SYMPTOM"),
        ]
        for text, expected in cases:
            with self.subTest(text=text, expected=expected):
                self.assert_category(text, "ta", expected)


if __name__ == "__main__":
    unittest.main()
