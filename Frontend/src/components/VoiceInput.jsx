import { useRef, useState } from "react";
import "./VoiceInput.css";

function VoiceInput({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    setError("");

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    // Keep listening instead of stopping after one short result
    recognition.continuous = true;

    // Show results while speaking
    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        console.log(
          "Final transcript:",
          finalTranscript
        );

        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was denied. Please allow microphone access in Chrome."
        );
      } else if (event.error === "no-speech") {
        setError(
          "No speech detected. Please try speaking again."
        );
      } else if (event.error === "audio-capture") {
        setError(
          "Chrome could not access your microphone."
        );
      } else if (event.error === "network") {
        setError(
          "Speech recognition needs an internet connection."
        );
      } else {
        setError(
          `Speech recognition error: ${event.error}`
        );
      }

      setListening(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");

      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Could not start recognition:",
        error
      );

      setListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setListening(false);
  };

  const handleVoiceButton = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!supported) {
    return (
      <p className="voice-not-supported">
        Voice input is not supported in this browser.
        <br />
        Please use Google Chrome.
      </p>
    );
  }

  return (
    <div className="voice-input">

      <button
        type="button"
        className={`voice-button ${
          listening ? "listening" : ""
        }`}
        onClick={handleVoiceButton}
        title={listening ? "Stop voice recording" : "Dictate your business description"}
      >
        <span className="mic-icon">
          {listening ? (
            <span className="voice-waves" aria-hidden="true">
              <span className="wave-bar b1" />
              <span className="wave-bar b2" />
              <span className="wave-bar b3" />
            </span>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </span>

        <span>
          {listening
            ? "Listening..."
            : "Voice Input"}
        </span>
      </button>

      {listening && (
        <p className="listening-text">
          🎙️ Listening... Tell me about your business.
        </p>
      )}

      {error && (
        <p className="voice-error">
          {error}
        </p>
      )}

    </div>
  );
}

export default VoiceInput;