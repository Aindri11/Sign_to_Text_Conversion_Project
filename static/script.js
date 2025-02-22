let sentence = "";
let word = "";
let isPredicting = false; // Track prediction state

function updateText() {
    if (!isPredicting) return; // Stop if prediction is not active

    fetch("/predict")
        .then(response => response.json())
        .then(data => {
            let symbol = data.symbol;
            document.getElementById("character").innerText = symbol;

            if (symbol !== "blank") {
                word += symbol;
                document.getElementById("predicted-word").innerText = word;
                fetchWordSuggestions(word);
            }
        })
        .catch(error => console.error("Error fetching prediction:", error));

    setTimeout(updateText, 1000); // Recursively call for continuous prediction
}

function fetchWordSuggestions(word) {
    fetch(`/word_suggestions?word=${word}`)
        .then(response => response.json())
        .then(data => {
            let suggestions = data.suggestions;
            document.getElementById("suggestion1").innerText = suggestions[0] || "";
            document.getElementById("suggestion2").innerText = suggestions[1] || "";
            document.getElementById("suggestion3").innerText = suggestions[2] || "";
        })
        .catch(error => console.error("Error fetching suggestions:", error));
}

function selectWord(selectedWord) {
    document.getElementById("predicted-word").innerText = selectedWord;
    word = selectedWord;
}

function addWordToSentence() {
    if (word.length > 0) {
        sentence += word + " ";
        document.getElementById("sentence-text").innerText = sentence;
        word = "";
        document.getElementById("predicted-word").innerText = "_";
        clearSuggestions();
    }
}

function clearSuggestions() {
    document.getElementById("suggestion1").innerText = "";
    document.getElementById("suggestion2").innerText = "";
    document.getElementById("suggestion3").innerText = "";
}

function speakSentence() {
    let text = document.getElementById("sentence-text").innerText.trim();
    let langCode = document.getElementById("language-select").value;

    if (!text) {
        alert("No sentence to speak!");
        return;
    }

    let speech = new SpeechSynthesisUtterance(text);

    // Ensure proper language code for text-to-speech
    let langMap = {
        "en": "en-US", // English
        "hi": "hi-IN", // Hindi
        "es": "es-ES", // Spanish
        "fr": "fr-FR", // French
        "de": "de-DE"  // German
    };

    speech.lang = langMap[langCode] || "en-US"; // Default to English if not found
    speech.rate = 1;
    speech.pitch = 1;

    speechSynthesis.speak(speech);
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("predict-btn").addEventListener("click", function () {
        isPredicting = !isPredicting; // Toggle prediction on/off
        if (isPredicting) {
            updateText();
            document.getElementById("predict-btn").innerText = "⏹ Stop Prediction";
        } else {
            document.getElementById("predict-btn").innerText = "🎯 Start Prediction";
        }
    });

    document.getElementById("add-word-btn").addEventListener("click", addWordToSentence);

    document.getElementById("clear-btn").addEventListener("click", function () {
        document.getElementById("character").innerText = "_";
        document.getElementById("predicted-word").innerText = "_";
        document.getElementById("sentence-text").innerText = "";
        sentence = "";
        word = "";
        clearSuggestions();
    });

    document.getElementById("suggestion1").addEventListener("click", function () {
        selectWord(this.innerText);
    });
    document.getElementById("suggestion2").addEventListener("click", function () {
        selectWord(this.innerText);
    });
    document.getElementById("suggestion3").addEventListener("click", function () {
        selectWord(this.innerText);
    });
});
