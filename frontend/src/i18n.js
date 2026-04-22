import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
const resources = {
  en: {
    translation: {
      "app_title": "SuryaX AI",
      "app_subtitle": "INTELLIGENT CODE ASSISTANT",
      "clear_context": "Clear Context",
      "import_file": "Import File",
      "editor_title": "Editor",
      "console_title": "Analysis Console",
      "placeholder_ask": "Ask a question about your code (e.g. Can you convert this to Python?)",
      "thinking": "Thinking",
      "action_explain": "Explain",
      "action_debug": "Debug",
      "action_optimize": "Optimize",
      "action_docs": "Docs",
      "action_complexity": "Complexity",
      "action_test": "Test",
      "download_pdf": "Download PDF",
      "welcome_msg": "👋 Hello! I'm **SuryaX AI Assistant**. Paste your code and click any button below to get intelligent analysis!",
      "empty_code_msg": "⚠️ Please enter some code first!",
      "chat_cleared": "✨ Context cleared! Ready for new analysis."
    }
  },
  hi: {
    translation: {
      "app_title": "SuryaX AI",
      "app_subtitle": "बुद्धिमान कोड सहायक (INTELLIGENT ASST)",
      "clear_context": "चैट डिलीट (Clear Context)",
      "import_file": "फाइल इंपोर्ट (Import File)",
      "editor_title": "एडिटर",
      "console_title": "विश्लेषण कंसोल",
      "placeholder_ask": "अपने कोड के बारे में कोई सवाल पूछें...",
      "thinking": "सोच रहा हूँ",
      "action_explain": "समझाएं (Explain)",
      "action_debug": "डिबग (Debug)",
      "action_optimize": "ऑप्टिमाइज़ (Optimize)",
      "action_docs": "डॉक्यूमेंटेशन (Docs)",
      "action_complexity": "कठिनाई (Complexity)",
      "action_test": "टेस्ट (Test)",
      "download_pdf": "पीडीएफ डाउनलोड (PDF)",
      "welcome_msg": "👋 नमस्ते! मैं **SuryaX AI Assistant** हूँ। अपना कोड पेस्ट करें और विश्लेषण पाने के लिए नीचे किसी भी बटन पर क्लिक करें!",
      "empty_code_msg": "⚠️ कृपया पहले कुछ कोड डालें!",
      "chat_cleared": "✨ चैट डिलीट हो गई! नए विश्लेषण के लिए तैयार।"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
