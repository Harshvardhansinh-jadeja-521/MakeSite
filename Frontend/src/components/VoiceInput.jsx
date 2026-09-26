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
      >
        <span className="mic-icon">
          {listening ? "⏹️" : "🎤"}
        </span>

        {listening
          ? "Stop Listening"
          : "Describe with Voice"}
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