/**
 * All patient-facing text, per language, in one place.
 *
 * NOTE ON TRANSLATION QUALITY: these are starter translations meant to get
 * the multilingual flow working end-to-end. They have NOT been reviewed by
 * a native speaker or a medical-language specialist. Because this is a
 * healthcare app, please get the Telugu/Hindi/Tamil strings checked by a
 * native speaker (ideally someone with clinical-language experience)
 * before this goes anywhere near real patients — a mistranslated prompt
 * here is a bigger deal than in a typical app.
 *
 * How to add a language: add its code to LANGUAGES below, then add a
 * matching key to every entry in STRINGS. Anything left untranslated
 * automatically falls back to English (see t() in LanguageContext.jsx).
 */

export const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", bcp47: "en-IN" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", bcp47: "te-IN" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", bcp47: "hi-IN" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", bcp47: "ta-IN" },
];

export const STRINGS = {
  // ---- Language picker ----
  chooseLanguage: {
    en: "Choose your language",
    te: "మీ భాషను ఎంచుకోండి",
    hi: "अपनी भाषा चुनें",
    ta: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
  },

  // ---- Login ----
  loginEyebrow: {
    en: "Voice-first triage",
    te: "వాయిస్-ఫస్ట్ ట్రయాజ్",
    hi: "वॉइस-फर्स्ट ट्रायाज",
    ta: "குரல்-முதல் பரிசோதனை",
  },
  loginHeadline: {
    en: "Tell us what's wrong. We'll listen.",
    te: "మీకు ఏమి ఇబ్బందిగా ఉందో చెప్పండి. మేము వింటాము.",
    hi: "हमें बताएं क्या तकलीफ़ है। हम सुनेंगे।",
    ta: "என்ன பிரச்சனை என்று சொல்லுங்கள். நாங்கள் கேட்கிறோம்.",
  },
  loginSubcopy: {
    en: "Speak in your own words. A doctor reviews what you share and replies with guidance.",
    te: "మీ సొంత మాటల్లో మాట్లాడండి. మీరు చెప్పినది వైద్యుడు చూసి సలహా ఇస్తారు.",
    hi: "अपने शब्दों में बताएं। डॉक्टर आपकी बात सुनकर सलाह देंगे।",
    ta: "உங்கள் சொந்த வார்த்தைகளில் பேசுங்கள். மருத்துவர் பார்த்து ஆலோசனை தருவார்.",
  },
  loginTitle: {
    en: "Welcome",
    te: "స్వాగతం",
    hi: "स्वागत है",
    ta: "வரவேற்கிறோம்",
  },
  loginPromptPhone: {
    en: "Please tell us your mobile number.",
    te: "దయచేసి మీ మొబైల్ నంబర్ చెప్పండి.",
    hi: "कृपया अपना मोबाइल नंबर बताएं।",
    ta: "உங்கள் மொபைல் எண்ணைச் சொல்லுங்கள்.",
  },
  loginPromptOtp: {
    en: "Please tell us the OTP you received.",
    te: "మీకు వచ్చిన OTP చెప్పండి.",
    hi: "आपको मिला OTP बताएं।",
    ta: "உங்களுக்கு வந்த OTP-ஐ சொல்லுங்கள்.",
  },
  loginPromptConfirmPhone: {
    en: "Please say or type your mobile number again to confirm it.",
    te: "నిర్ధారించడానికి దయచేసి మీ మొబైల్ నంబర్‌ను మళ్ళీ చెప్పండి లేదా టైప్ చేయండి.",
    hi: "पुष्टि के लिए कृपया अपना मोबाइल नंबर फिर से बताएं या टाइप करें।",
    ta: "உறுதிப்படுத்த உங்கள் மொபைல் எண்ணை மீண்டும் சொல்லுங்கள் அல்லது தட்டச்சு செய்யுங்கள்.",
  },
  confirmPhoneTitle: {
    en: "Confirm your number",
    te: "మీ నంబర్‌ను నిర్ధారించండి",
    hi: "अपना नंबर पुष्टि करें",
    ta: "உங்கள் எண்ணை உறுதிப்படுத்தவும்",
  },
  confirmPhoneLabel: {
    en: "Retype mobile number",
    te: "మొబైల్ నంబర్‌ను మళ్ళీ టైప్ చేయండి",
    hi: "मोबाइल नंबर फिर से टाइप करें",
    ta: "மொபைல் எண்ணை மீண்டும் தட்டச்சு செய்யவும்",
  },
  phoneLabel: {
    en: "Phone number",
    te: "ఫోన్ నంబర్",
    hi: "फ़ोन नंबर",
    ta: "தொலைபேசி எண்",
  },
  otpLabelPrefix: {
    en: "OTP sent to",
    te: "OTP పంపిన నంబర్",
    hi: "OTP भेजा गया",
    ta: "OTP அனுப்பப்பட்டது",
  },
  useVoiceInstead: {
    en: "Use voice instead",
    te: "వాయిస్ ఉపయోగించండి",
    hi: "आवाज़ से बताएं",
    ta: "குரலைப் பயன்படுத்தவும்",
  },
  typeInstead: {
    en: "Type instead",
    te: "టైప్ చేయండి",
    hi: "टाइप करें",
    ta: "தட்டச்சு செய்யவும்",
  },
  sendOtp: {
    en: "Send OTP",
    te: "OTP పంపండి",
    hi: "OTP भेजें",
    ta: "OTP அனுப்பவும்",
  },
  verifyContinue: {
    en: "Verify & continue",
    te: "ధృవీకరించి కొనసాగండి",
    hi: "सत्यापित करें और जारी रखें",
    ta: "சரிபார்த்து தொடரவும்",
  },
  security: {
    en: "Your details are stored securely and shared only with your doctor.",
    te: "మీ వివరాలు సురక్షితంగా ఉంచబడతాయి, మీ వైద్యుడితో మాత్రమే పంచుకోబడతాయి.",
    hi: "आपकी जानकारी सुरक्षित रखी जाती है और केवल आपके डॉक्टर के साथ साझा की जाती है।",
    ta: "உங்கள் விவரங்கள் பாதுகாப்பாக சேமிக்கப்பட்டு, உங்கள் மருத்துவருடன் மட்டும் பகிரப்படும்.",
  },

  // ---- Basic details ----
  fieldName: {
    en: "What's your name?",
    te: "మీ పేరు ఏమిటి?",
    hi: "आपका नाम क्या है?",
    ta: "உங்கள் பெயர் என்ன?",
  },
  fieldAge: {
    en: "How old are you?",
    te: "మీ వయస్సు ఎంత?",
    hi: "आपकी उम्र क्या है?",
    ta: "உங்கள் வயது என்ன?",
  },
  fieldGender: {
    en: "Gender",
    te: "లింగం",
    hi: "लिंग",
    ta: "பாலினம்",
  },
  fieldLocation: {
    en: "Which city are you in?",
    te: "మీరు ఏ నగరంలో ఉన్నారు?",
    hi: "आप किस शहर में हैं?",
    ta: "நீங்கள் எந்த நகரத்தில் இருக்கிறீர்கள்?",
  },
  fieldContact: {
    en: "A number we can reach you on",
    te: "మిమ్మల్ని సంప్రదించగల నంబర్",
    hi: "जिस नंबर पर आपसे संपर्क कर सकें",
    ta: "உங்களைத் தொடர்பு கொள்ளும் எண்",
  },
  fieldConditions: {
    en: "Any existing conditions?",
    te: "ఇప్పటికే ఏవైనా ఆరోగ్య సమస్యలు ఉన్నాయా?",
    hi: "क्या पहले से कोई बीमारी है?",
    ta: "ஏற்கனவே ஏதேனும் உடல்நல பிரச்சனை உள்ளதா?",
  },
  genderFemale: { en: "Female", te: "స్త్రీ", hi: "महिला", ta: "பெண்" },
  genderMale: { en: "Male", te: "పురుషుడు", hi: "पुरुष", ta: "ஆண்" },
  genderOther: { en: "Other", te: "ఇతర", hi: "अन्य", ta: "மற்றவை" },
  skip: { en: "Skip", te: "దాటవేయండి", hi: "छोड़ें", ta: "தவிர்க்கவும்" },
  next: { en: "Next", te: "తదుపరి", hi: "आगे", ta: "அடுத்து" },
  continueToSymptoms: {
    en: "Continue to symptoms",
    te: "లక్షణాల వైపు కొనసాగండి",
    hi: "लक्षणों की ओर आगे बढ़ें",
    ta: "அறிகுறிகளுக்குச் செல்லவும்",
  },

  // ---- Symptom recording ----
  symptomTitleIdle: {
    en: "Describe what you're feeling",
    te: "మీకు ఎలా అనిపిస్తుందో చెప్పండి",
    hi: "आपको कैसा महसूस हो रहा है बताएं",
    ta: "உங்களுக்கு எப்படி இருக்கிறது என்று சொல்லுங்கள்",
  },
  symptomTitleFollowup: {
    en: "Just a couple more things",
    te: "మరికొన్ని విషయాలు",
    hi: "कुछ और बातें",
    ta: "இன்னும் சில விவரங்கள்",
  },
  symptomTitleSending: {
    en: "Got it — sending to your doctor",
    te: "అర్థమైంది — మీ వైద్యుడికి పంపుతున్నాం",
    hi: "समझ गया — आपके डॉक्टर को भेजा जा रहा है",
    ta: "புரிந்தது — உங்கள் மருத்துவருக்கு அனுப்புகிறோம்",
  },
  symptomSubtitle: {
    en: "Speak naturally, in your own words.",
    te: "మీ సొంత మాటల్లో సహజంగా మాట్లాడండి.",
    hi: "अपने शब्दों में सहज रूप से बोलें।",
    ta: "உங்கள் சொந்த வார்த்தைகளில் இயல்பாகப் பேசுங்கள்.",
  },
  tapToSpeak: {
    en: "Tap to speak",
    te: "మాట్లాడటానికి తాకండి",
    hi: "बोलने के लिए टैप करें",
    ta: "பேச தட்டவும்",
  },
  recording: {
    en: "recording",
    te: "రికార్డ్ అవుతోంది",
    hi: "रिकॉर्ड हो रहा है",
    ta: "பதிவு செய்யப்படுகிறது",
  },
  listening: {
    en: "Listening…",
    te: "వింటున్నాం…",
    hi: "सुन रहे हैं…",
    ta: "கேட்கிறோம்…",
  },
  addMore: {
    en: "Wait, let me add more",
    te: "ఆగండి, మరికొంచెం చెప్పాలి",
    hi: "रुकिए, मुझे और बताना है",
    ta: "காத்திருங்கள், இன்னும் சொல்ல வேண்டும்",
  },
  followupQ1: {
    en: "Since how many days has this been going on?",
    te: "ఇది ఎన్ని రోజుల నుండి ఉంది?",
    hi: "यह कब से हो रहा है, कितने दिन?",
    ta: "இது எத்தனை நாட்களாக இருக்கிறது?",
  },
  followupQ2: {
    en: "Have you taken any medicine for it?",
    te: "దీనికి మీరు ఏదైనా మందు తీసుకున్నారా?",
    hi: "क्या आपने इसके लिए कोई दवा ली है?",
    ta: "இதற்கு ஏதேனும் மருந்து எடுத்துக்கொண்டீர்களா?",
  },

  // ---- Voice field / speech recognition status ----
  micNotSupported: {
    en: "Voice input isn't supported in this browser — please type your answer instead.",
    te: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ లేదు — దయచేసి టైప్ చేయండి.",
    hi: "इस ब्राउज़र में आवाज़ से इनपुट संभव नहीं है — कृपया टाइप करें।",
    ta: "இந்த உலாவியில் குரல் உள்ளீடு இல்லை — தட்டச்சு செய்யவும்.",
  },
  micDenied: {
    en: "Microphone access was blocked. Please allow it and try again.",
    te: "మైక్రోఫోన్ యాక్సెస్ నిరాకరించబడింది. దయచేసి అనుమతించి మళ్ళీ ప్రయత్నించండి.",
    hi: "माइक्रोफ़ोन एक्सेस अवरुद्ध है। कृपया अनुमति दें और फिर से कोशिश करें।",
    ta: "மைக்ரோஃபோன் அணுகல் தடுக்கப்பட்டது. அனுமதி அளித்து மீண்டும் முயற்சிக்கவும்.",
  },

  // ---- Validation errors ----
  errorRequired: {
    en: "This can't be left empty.",
    te: "దీన్ని ఖాళీగా వదలకూడదు.",
    hi: "इसे खाली नहीं छोड़ सकते।",
    ta: "இதை காலியாக விட முடியாது.",
  },
  errorPhone: {
    en: "Enter a valid 10-digit mobile number.",
    te: "సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.",
    hi: "सही 10 अंकों का मोबाइल नंबर डालें।",
    ta: "சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.",
  },
  errorPhoneMismatch: {
    en: "This doesn't match the number you entered before.",
    te: "ఇది మీరు ముందు నమోదు చేసిన నంబర్‌తో సరిపోలడం లేదు.",
    hi: "यह आपके पहले डाले गए नंबर से मेल नहीं खाता।",
    ta: "இது நீங்கள் முன்பு உள்ளிட்ட எண்ணுடன் பொருந்தவில்லை.",
  },
  errorLandlineOrPhone: {
    en: "Enter a valid contact number (8–12 digits).",
    te: "సరైన సంప్రదింపు నంబర్ నమోదు చేయండి (8–12 అంకెలు).",
    hi: "सही संपर्क नंबर डालें (8–12 अंक)।",
    ta: "சரியான தொடர்பு எண்ணை உள்ளிடவும் (8–12 இலக்கங்கள்).",
  },
  errorOtp: {
    en: "Enter the 4-digit code exactly as received.",
    te: "వచ్చిన 4 అంకెల కోడ్‌ను సరిగ్గా నమోదు చేయండి.",
    hi: "मिला हुआ 4 अंकों का कोड सही से डालें।",
    ta: "வந்த 4 இலக்க குறியீட்டை சரியாக உள்ளிடவும்.",
  },
  errorEmail: {
    en: "Enter a valid email address.",
    te: "సరైన ఇమెయిల్ చిరునామా నమోదు చేయండి.",
    hi: "सही ईमेल पता डालें।",
    ta: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
  },
  errorEmailOrPhone: {
    en: "Enter a valid email or 10-digit mobile number.",
    te: "సరైన ఇమెయిల్ లేదా 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.",
    hi: "सही ईमेल या 10 अंकों का मोबाइल नंबर डालें।",
    ta: "சரியான மின்னஞ்சல் அல்லது 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.",
  },
  errorAge: {
    en: "Enter a valid age (1–120).",
    te: "సరైన వయస్సు నమోదు చేయండి (1–120).",
    hi: "सही उम्र डालें (1–120)।",
    ta: "சரியான வயதை உள்ளிடவும் (1–120).",
  },
  errorName: {
    en: "Enter a valid name (letters only).",
    te: "సరైన పేరు నమోదు చేయండి (అక్షరాలు మాత్రమే).",
    hi: "सही नाम डालें (केवल अक्षर)।",
    ta: "சரியான பெயரை உள்ளிடவும் (எழுத்துக்கள் மட்டும்).",
  },
  errorPassword: {
    en: "Password must be at least 6 characters.",
    te: "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.",
    hi: "पासवर्ड कम से कम 6 अक्षरों का हो।",
    ta: "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.",
  },
  errorExperience: {
    en: "Enter valid years of experience (0–60).",
    te: "సరైన అనుభవ సంవత్సరాలు నమోదు చేయండి (0–60).",
    hi: "सही अनुभव के वर्ष डालें (0–60)।",
    ta: "சரியான அனுபவ ஆண்டுகளை உள்ளிடவும் (0–60).",
  },

  // ---- Brand ----
  appName: { en: "Triage", te: "Triage", hi: "Triage", ta: "Triage" },

  // ---- Language welcome screen (the very first screen) ----
  welcomeToApp: {
    en: "Welcome to Triage",
    te: "Triage కి స్వాగతం",
    hi: "Triage में आपका स्वागत है",
    ta: "Triage-க்கு வரவேற்கிறோம்",
  },
  chooseLanguageVoiceHint: {
    en: "You can also speak to choose your language",
    te: "మీ భాషను ఎంచుకోవడానికి మాట్లాడవచ్చు కూడా",
    hi: "आप अपनी भाषा चुनने के लिए बोल भी सकते हैं",
    ta: "உங்கள் மொழியைத் தேர்ந்தெடுக்க பேசவும் முடியும்",
  },

  // ---- OTP screen redesign ----
  verifyMobileTitle: {
    en: "Verify your mobile number",
    te: "మీ మొబైల్ నంబర్‌ను ధృవీకరించండి",
    hi: "अपना मोबाइल नंबर सत्यापित करें",
    ta: "உங்கள் மொபைல் எண்ணைச் சரிபார்க்கவும்",
  },
  otpSubtitle: {
    en: "Enter the 4-digit code sent to your mobile.",
    te: "మీ మొబైల్‌కు పంపిన 4 అంకెల కోడ్‌ను నమోదు చేయండి.",
    hi: "आपके मोबाइल पर भेजा गया 4 अंकों का कोड डालें।",
    ta: "உங்கள் மொபைலுக்கு அனுப்பப்பட்ட 4 இலக்க குறியீட்டை உள்ளிடவும்.",
  },
  didntReceiveCode: {
    en: "Didn't receive the code?",
    te: "కోడ్ రాలేదా?",
    hi: "कोड नहीं मिला?",
    ta: "குறியீடு வரவில்லையா?",
  },
  resendOtp: {
    en: "Resend OTP",
    te: "OTP మళ్ళీ పంపండి",
    hi: "OTP फिर भेजें",
    ta: "OTP-ஐ மீண்டும் அனுப்பவும்",
  },
  resendOtpIn: {
    en: "Resend OTP in",
    te: "OTP మళ్ళీ పంపడానికి",
    hi: "OTP दोबारा भेजने में",
    ta: "OTP மீண்டும் அனுப்ப",
  },
  changePhoneNumber: {
    en: "Change phone number",
    te: "ఫోన్ నంబర్ మార్చండి",
    hi: "फ़ोन नंबर बदलें",
    ta: "தொலைபேசி எண்ணை மாற்றவும்",
  },

  // ---- Basic details supporting lines ----
  typeOrSpeakHint: {
    en: "You can type it or tap the microphone to say it.",
    te: "మీరు దీన్ని టైప్ చేయవచ్చు లేదా చెప్పడానికి మైక్రోఫోన్ నొక్కవచ్చు.",
    hi: "आप इसे टाइप कर सकते हैं या बोलने के लिए माइक्रोफ़ोन दबा सकते हैं।",
    ta: "நீங்கள் இதைத் தட்டச்சு செய்யலாம் அல்லது சொல்ல மைக்ரோஃபோனைத் தட்டலாம்.",
  },
  typeOrSpeakOrSkipHint: {
    en: "Type it, say it, or just skip if none.",
    te: "టైప్ చేయండి, చెప్పండి, లేదా ఏమీ లేకపోతే దాటవేయండి.",
    hi: "टाइप करें, बोलें, या कुछ न हो तो छोड़ दें।",
    ta: "தட்டச்சு செய்யவும், சொல்லவும், இல்லையெனில் தவிர்க்கவும்.",
  },
  fieldAllergies: {
    en: "Any allergies we should know about?",
    te: "మేము తెలుసుకోవాల్సిన అలర్జీలు ఏవైనా ఉన్నాయా?",
    hi: "क्या हमें किसी एलर्जी के बारे में पता होना चाहिए?",
    ta: "நாங்கள் தெரிந்துகொள்ள வேண்டிய ஒவ்வாமைகள் ஏதேனும் உள்ளதா?",
  },

  // ---- Waiting screen redesign ----
  waitingTitle: {
    en: "A doctor is reviewing your symptoms",
    te: "వైద్యుడు మీ లక్షణాలను పరిశీలిస్తున్నారు",
    hi: "एक डॉक्टर आपके लक्षणों की समीक्षा कर रहे हैं",
    ta: "ஒரு மருத்துவர் உங்கள் அறிகுறிகளை பரிசீலிக்கிறார்",
  },
  waitingSubtitle: {
    en: "Your information has been received. Please wait while a doctor reviews it.",
    te: "మీ సమాచారం అందింది. వైద్యుడు దాన్ని పరిశీలించే వరకు వేచి ఉండండి.",
    hi: "आपकी जानकारी मिल गई है। कृपया डॉक्टर के समीक्षा करने तक प्रतीक्षा करें।",
    ta: "உங்கள் தகவல் பெறப்பட்டது. மருத்துவர் பரிசீலிக்கும் வரை காத்திருக்கவும்.",
  },
  stepSymptomsReceived: {
    en: "Symptoms received",
    te: "లక్షణాలు అందాయి",
    hi: "लक्षण प्राप्त हुए",
    ta: "அறிகுறிகள் பெறப்பட்டன",
  },
  stepSymptomsReceivedDesc: {
    en: "Your symptoms were successfully submitted.",
    te: "మీ లక్షణాలు విజయవంతంగా సమర్పించబడ్డాయి.",
    hi: "आपके लक्षण सफलतापूर्वक भेज दिए गए।",
    ta: "உங்கள் அறிகுறிகள் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டன.",
  },
  stepDoctorReviewing: {
    en: "Doctor reviewing",
    te: "వైద్యుడు పరిశీలిస్తున్నారు",
    hi: "डॉक्टर समीक्षा कर रहे हैं",
    ta: "மருத்துவர் பரிசீலிக்கிறார்",
  },
  stepDoctorReviewingDesc: {
    en: "A doctor is reviewing your information.",
    te: "వైద్యుడు మీ సమాచారాన్ని పరిశీలిస్తున్నారు.",
    hi: "एक डॉक्टर आपकी जानकारी की समीक्षा कर रहे हैं।",
    ta: "ஒரு மருத்துவர் உங்கள் தகவலை பரிசீலிக்கிறார்.",
  },
  stepDoctorReply: {
    en: "Doctor's reply",
    te: "వైద్యుడి సమాధానం",
    hi: "डॉक्टर का जवाब",
    ta: "மருத்துவரின் பதில்",
  },
  stepDoctorReplyDesc: {
    en: "You'll be notified when the response is ready.",
    te: "సమాధానం సిద్ధమైనప్పుడు మీకు తెలియజేయబడుతుంది.",
    hi: "जवाब तैयार होते ही आपको सूचित किया जाएगा।",
    ta: "பதில் தயாரானதும் உங்களுக்குத் தெரிவிக்கப்படும்.",
  },
  waitingNote: {
    en: "You can safely leave this page. We'll notify you when your doctor replies.",
    te: "మీరు ఈ పేజీని సురక్షితంగా వదిలేయవచ్చు. మీ వైద్యుడు సమాధానం ఇచ్చినప్పుడు మేము తెలియజేస్తాము.",
    hi: "आप इस पेज को सुरक्षित रूप से छोड़ सकते हैं। डॉक्टर के जवाब देने पर हम आपको सूचित करेंगे।",
    ta: "இந்தப் பக்கத்தை பாதுகாப்பாக விட்டுவிடலாம். மருத்துவர் பதிலளிக்கும்போது உங்களுக்குத் தெரிவிப்போம்.",
  },
  saveNote: { en: "Save note", te: "నోట్ సేవ్ చేయండి", hi: "नोट सेव करें", ta: "குறிப்பைச் சேமிக்கவும்" },
  savedNote: { en: "Saved", te: "సేవ్ చేయబడింది", hi: "सेव हो गया", ta: "சேமிக்கப்பட்டது" },
  backToHome: {
    en: "Back to home",
    te: "హోమ్‌కు తిరిగి వెళ్ళండి",
    hi: "होम पर वापस जाएं",
    ta: "முகப்புக்குத் திரும்பு",
  },

  // ---- Doctor reply screen ----
  doctorRepliedTitle: {
    en: "Your doctor has replied",
    te: "మీ వైద్యుడు సమాధానం ఇచ్చారు",
    hi: "आपके डॉक्टर ने जवाब दिया है",
    ta: "உங்கள் மருத்துவர் பதிலளித்துள்ளார்",
  },
  doctorsNote: {
    en: "Doctor's note",
    te: "వైద్యుడి నోట్",
    hi: "डॉक्टर का नोट",
    ta: "மருத்துவரின் குறிப்பு",
  },
  playReply: {
    en: "Play doctor's reply",
    te: "వైద్యుడి సమాధానం వినండి",
    hi: "डॉक्टर का जवाब सुनें",
    ta: "மருத்துவரின் பதிலைக் கேளுங்கள்",
  },
  playingReply: {
    en: "Playing…",
    te: "ప్లే అవుతోంది…",
    hi: "चल रहा है…",
    ta: "இயங்குகிறது…",
  },
  translationNotice: {
    en: "Shown in English — spoken translation isn't available yet.",
    te: "ఇంగ్లీష్‌లో చూపబడింది — వాయిస్ అనువాదం ఇంకా అందుబాటులో లేదు.",
    hi: "अंग्रेज़ी में दिखाया गया है — बोली जाने वाली अनुवाद अभी उपलब्ध नहीं है।",
    ta: "ஆங்கிலத்தில் காட்டப்படுகிறது — பேசும் மொழிபெயர்ப்பு இன்னும் கிடைக்கவில்லை.",
  },
};

/** Look up a translated string; falls back to English, then the key itself. */
export function translate(key, lang) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}