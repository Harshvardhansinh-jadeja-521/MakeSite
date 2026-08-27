import { useState } from "react";
import "./App.css";

const questions = {
  business_name: "What is the name of your business?",
  category: "What type of business do you run?",
  location: "Where is your business located?",
};

function App() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [currentField, setCurrentField] = useState(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("Please describe your business first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setCurrentField(null);
    setClarificationAnswer("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      setResult(data);

      if (
        data.missing_fields &&
        data.missing_fields.length > 0
      ) {
        setCurrentField(data.missing_fields[0]);
      }
    } catch (error) {
      console.error(error);

      setResult({
        error: "Could not connect to the backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClarificationSubmit = async () => {
    if (!clarificationAnswer.trim()) {
      alert("Please enter an answer.");
      return;
    }

    if (!result || !result.data || !currentField) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/update-business",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            business_data: result.data,
            field: currentField,
            value: clarificationAnswer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Backend update failed");
      }

      setResult(data);
      setClarificationAnswer("");

      if (
        data.missing_fields &&
        data.missing_fields.length > 0
      ) {
        setCurrentField(data.missing_fields[0]);
      } else {
        setCurrentField(null);
      }
    } catch (error) {
      console.error(error);

      setResult({
        error: "Could not update business information.",
      });

      setCurrentField(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAgain = () => {
    setDescription("");
    setResult(null);
    setCurrentField(null);
    setClarificationAnswer("");
  };

  return (
    <div className="app">
      <div className="container">

        <header className="header">
          <h1>MakeSite</h1>

          <p>
            Turn your business description into a website.
          </p>
        </header>

        {!result && (
          <section className="input-card">

            <h2>Tell us about your business</h2>

            <p className="subtitle">
              Describe your business naturally. You can write in English,
              Hindi, or Hinglish.
            </p>

            <textarea
              placeholder="Example: I run a cyber cafe called Harsh Cyber Cafe in Ahmedabad. We are open 24/7 and provide printing, scanning and internet services."
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Extracting information..."
                : "Extract Information"}
            </button>

          </section>
        )}

        {result && result.error && (
          <div className="error-card">

            <h3>Something went wrong</h3>

            <p>{result.error}</p>

            <button onClick={handleStartAgain}>
              Try Again
            </button>

          </div>
        )}

        {result && result.data && (
          <>
            <section className="result-card">

              <h2>Business Information</h2>

              <div className="info-grid">

                <InfoItem
                  label="Business Name"
                  value={result.data.business_name}
                />

                <InfoItem
                  label="Owner"
                  value={result.data.owner_name}
                />

                <InfoItem
                  label="Category"
                  value={result.data.category}
                />

                <InfoItem
                  label="Location"
                  value={result.data.location}
                />

                <InfoItem
                  label="Opening Hours"
                  value={result.data.hours}
                />

                <InfoItem
                  label="Contact"
                  value={result.data.contact}
                />

              </div>

              <div className="products-section">

                <h3>Products & Services</h3>

                {result.data.products &&
                result.data.products.length > 0 ? (

                  <div className="product-tags">

                    {result.data.products.map(
                      (product, index) => (
                        <span
                          className="product-tag"
                          key={index}
                        >
                          {product}
                        </span>
                      )
                    )}

                  </div>

                ) : (

                  <p className="empty-text">
                    No products or services mentioned.
                  </p>

                )}

              </div>

            </section>

            {currentField && (
              <section className="clarification-card">

                <h2>We need one more detail</h2>

                <p>
                  {questions[currentField]}
                </p>

                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={clarificationAnswer}
                  onChange={(event) =>
                    setClarificationAnswer(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !loading
                    ) {
                      handleClarificationSubmit();
                    }
                  }}
                />

                <button
                  onClick={handleClarificationSubmit}
                  disabled={loading}
                >
                  {loading
                    ? "Updating..."
                    : "Continue"}
                </button>

              </section>
            )}

            {!currentField &&
              result.missing_fields &&
              result.missing_fields.length === 0 && (

                <section className="success-card">

                  <h2>
                    ✓ All required information collected!
                  </h2>

                  <p>
                    Your business information is ready for the next step.
                  </p>

                  <button>
                    Generate Website
                  </button>

                  <button
                    className="start-again-button"
                    onClick={handleStartAgain}
                  >
                    Start Again
                  </button>

                </section>

              )}

          </>
        )}

      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">

      <span className="info-label">
        {label}
      </span>

      <span className="info-value">
        {value || "Not provided"}
      </span>

    </div>
  );
}

export default App;