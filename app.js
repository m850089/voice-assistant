document.addEventListener("DOMContentLoaded", () => {
    const responseTextElement = document.getElementById("response-text");
    const referenceTextElement = document.getElementById("reference-text");
    const transcriptionElement = document.getElementById("transcription");
    const startVoiceButton = document.getElementById("start-voice");
    const sendTextButton = document.getElementById("send-text");
    const speakAgainButton = document.getElementById("speak-again");
    const speakTranslationButton = document.getElementById("speak-translation");
    const speakQuestionButton = document.getElementById("speak-question");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Language settings
    const responseLanguage = "ja"; // Japanese for the assistant's reply
    const translationLanguage = "zh-TW"; // Traditional Chinese for reference

    // Speak Again Button Logic
    speakAgainButton.addEventListener("click", () => {
        const textToSpeak = responseTextElement.textContent.trim();
        if (textToSpeak) {
            speak(textToSpeak, responseLanguage);
        } else {
            console.error("No text to speak.");
        }
    });

    // Speak Translation Button Logic
    speakTranslationButton.addEventListener("click", () => {
        const textToSpeak = referenceTextElement.textContent.trim();
        if (textToSpeak) {
            speak(textToSpeak, translationLanguage);
        } else {
            console.error("No text to speak in translation.");
        }
    });

    // Speak Question Button Logic
    speakQuestionButton.addEventListener("click", () => {
        const textToSpeak = transcriptionElement.textContent.trim();
        if (textToSpeak) {
            speak(textToSpeak, responseLanguage);
        } else {
            console.error("No text to speak in question.");
        }
    });

    // SpeechRecognition setup
    if (!SpeechRecognition) {
        alert("您的瀏覽器不支援語音識別功能，請使用 Chrome 或 Edge。");
        startVoiceButton.disabled = true;
    } else {
        const recognition = new SpeechRecognition();
        recognition.lang = translationLanguage; // Input language set to Traditional Chinese

        startVoiceButton.addEventListener("click", () => {
            transcriptionElement.textContent = "正在聆聽...";
            responseTextElement.textContent = "";
            referenceTextElement.textContent = "";

            try {
                recognition.start();
            } catch (err) {
                console.error("Error starting speech recognition:", err);
                transcriptionElement.textContent = "語音識別啟動失敗，請重試。";
            }
        });

        recognition.onresult = async (event) => {
            const userInput = event.results[0][0].transcript;
            transcriptionElement.textContent = userInput;

            responseTextElement.textContent = "處理中...";
            referenceTextElement.textContent = "";

            const reply = await fetchChatGPTResponse(userInput, responseLanguage);
            responseTextElement.textContent = reply;

            speak(reply, responseLanguage);

            const chineseTranslation = await fetchChatGPTResponse(
                `請將以下內容翻譯為繁體中文：${reply}`,
                translationLanguage
            );
            referenceTextElement.textContent = chineseTranslation;
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            transcriptionElement.textContent = "語音識別失敗，請重試。";
        };
    }

    sendTextButton.addEventListener("click", async () => {
        const userInput = document.getElementById("text-input").value.trim();
        if (!userInput) {
            responseTextElement.textContent = "請輸入問題。";
            return;
        }
        responseTextElement.textContent = "處理中...";
        referenceTextElement.textContent = "";

        const reply = await fetchChatGPTResponse(userInput, responseLanguage);
        responseTextElement.textContent = reply;

        speak(reply, responseLanguage);

        const chineseTranslation = await fetchChatGPTResponse(
            `請將以下內容翻譯為繁體中文：${reply}`,
            translationLanguage
        );
        referenceTextElement.textContent = chineseTranslation;
    });

    async function fetchChatGPTResponse(userInput, language) {
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer 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`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: `請以 ${language} 回應，並確保答案不超過 300 個單詞。`
                        },
                        { role: "user", content: userInput }
                    ],
                    max_tokens: 600, // Increased token limit for longer replies
                    temperature: 0.7
                })
            });

            const data = await response.json();
            return data.choices[0]?.message?.content || "無法獲得有效回覆。";
        } catch (error) {
            console.error("Error fetching ChatGPT response:", error);
            return "請求失敗，請稍後再試。";
        }
    }

    function speak(text, language) {
        if (!window.speechSynthesis) {
            console.error("SpeechSynthesis API 不受支持");
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;

        utterance.onerror = (err) => {
            console.error("SpeechSynthesis error:", err);
        };

        window.speechSynthesis.speak(utterance);
    }
});
