import { useState } from "react";
import "./App.css";

import WebsitePreview from "./components/WebsitePreview";
import TemplateSelector from "./components/TemplateSelector";
import VoiceInput from "./components/VoiceInput";
import FloatingShapes from "./components/FloatingShapes";
import TiltCard from "./components/TiltCard";


const questions = {
  business_name: "What is the name of your business?",
  category: "What type of business do you run?",
  location: "Where is your business located?",
};


function App() {

  const [description, setDescription] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [showWebsite, setShowWebsite] = useState(false);

  const [showTemplates, setShowTemplates] = useState(false);

  const [selectedTemplate, setSelectedTemplate] =
    useState("modern");

  // AI-generated website content
  const [websiteContent, setWebsiteContent] =
    useState(null);

  const [clarificationAnswer, setClarificationAnswer] =
    useState("");

  const [currentField, setCurrentField] =
    useState(null);


  // --------------------------------
  // Extract Business Information
  // --------------------------------

  const handleSubmit = async () => {

    if (!description.trim()) {

      alert("Please describe your business first.");

      return;
    }


    setLoading(true);

    setResult(null);

    setCurrentField(null);

    setClarificationAnswer("");

    setWebsiteContent(null);


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

        throw new Error(
          "Backend request failed"
        );
      }


      setResult(data);


      if (
        data.missing_fields &&
        data.missing_fields.length > 0
      ) {

        setCurrentField(
          data.missing_fields[0]
        );

      }

    } catch (error) {

      console.error(error);


      setResult({
        error:
          "Could not connect to the backend.",
      });

    } finally {

      setLoading(false);

    }

  };


  // --------------------------------
  // Submit Clarification
  // --------------------------------

  const handleClarificationSubmit = async () => {

    if (!clarificationAnswer.trim()) {

      alert("Please enter an answer.");

      return;
    }


    if (
      !result ||
      !result.data ||
      !currentField
    ) {

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

        throw new Error(
          "Backend update failed"
        );

      }


      setResult(data);

      setClarificationAnswer("");


      if (
        data.missing_fields &&
        data.missing_fields.length > 0
      ) {

        setCurrentField(
          data.missing_fields[0]
        );

      } else {

        setCurrentField(null);

      }


    } catch (error) {

      console.error(error);


      setResult({

        error:
          "Could not update business information.",

      });


      setCurrentField(null);


    } finally {

      setLoading(false);

    }

  };


  // --------------------------------
  // Generate AI Website Content
  // --------------------------------

  const generateWebsiteContent = async () => {

    if (!result?.data) {

      return;

    }


    setLoading(true);


    try {

      const response = await fetch(
        "http://127.0.0.1:8000/generate-content",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            result.data
          ),

        }
      );


      const data = await response.json();


      if (
        !response.ok ||
        data.error
      ) {

        throw new Error(
          data.error ||
          "Content generation failed"
        );

      }


      // Save AI-generated content
      setWebsiteContent(
        data.content
      );


      // Open template selector
      setShowTemplates(true);


    } catch (error) {

      console.error(error);


      alert(
        "Could not generate website content. Please try again."
      );


    } finally {

      setLoading(false);

    }

  };


  // --------------------------------
  // Start Again
  // --------------------------------

  const handleStartAgain = () => {

    setDescription("");

    setResult(null);

    setCurrentField(null);

    setClarificationAnswer("");

    setShowWebsite(false);

    setShowTemplates(false);

    setSelectedTemplate("modern");

    setWebsiteContent(null);

  };


  // --------------------------------
  // Template Selector
  // --------------------------------

  if (
    showTemplates &&
    result?.data
  ) {

    return (

      <TemplateSelector

        selectedTemplate={
          selectedTemplate
        }

        onSelect={
          setSelectedTemplate
        }

        onContinue={() => {

          setShowTemplates(false);

          setShowWebsite(true);

        }}

        onBack={() => {

          setShowTemplates(false);

        }}

      />

    );

  }


  // --------------------------------
  // Generated Website
  // --------------------------------

  if (
    showWebsite &&
    result?.data
  ) {

    return (

      <WebsitePreview

        businessData={
          result.data
        }

        websiteContent={
          websiteContent
        }

        template={
          selectedTemplate
        }

        onBack={() => {

          setShowWebsite(false);

          setShowTemplates(true);

        }}

      />

    );

  }


  // --------------------------------
  // Main Application
  // --------------------------------

  return (

    <div className="app">

      {/* 3D Background */}
      <FloatingShapes />

      <div className="container">


        {/* Header */}

        <header className="header">

          <div className="header-badge">
            ✦ AI-Powered Website Builder
          </div>

          <h1 className="header-3d-title">
            <span className="title-layer">MakeSite</span>
          </h1>

          <p>
            Turn your business description
            into a website.
          </p>

          <div className="header-glow-line" />

        </header>


        {/* Business Description */}

        {!result && (

          <TiltCard className="tilt-wrapper" intensity={6}>
          <section className="input-card">

            <h2>
              Tell us about your business
            </h2>


            <p className="subtitle">

              Describe your business naturally.
              You can write in English, Hindi,
              or Hinglish.

            </p>


            <textarea

              placeholder="Example: I run a cyber cafe called Harsh Cyber Cafe in Ahmedabad. We are open 24/7 and provide printing, scanning and internet services."

              value={description}

              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }

            />


            {/* Voice Input */}

            <VoiceInput

              onTranscript={(text) => {

                setDescription(
                  (previous) =>
                    previous
                      ? `${previous} ${text}`
                      : text
                );

              }}

            />


            <button

              className="btn-3d"

              onClick={
                handleSubmit
              }

              disabled={loading}

            >

              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Extracting information...
                </span>
              ) : (
                <span className="btn-content">
                  <span className="btn-icon">⚡</span>
                  Extract Information
                </span>
              )}

            </button>


          </section>
          </TiltCard>

        )}


        {/* Error */}

        {result &&
          result.error && (

            <div className="error-card">

              <h3>
                Something went wrong
              </h3>

              <p>
                {result.error}
              </p>


              <button
                onClick={
                  handleStartAgain
                }
              >
                Try Again
              </button>

            </div>

          )}


        {/* Business Information */}

        {result &&
          result.data && (

            <>

              <TiltCard className="tilt-wrapper" intensity={5}>
              <section className="result-card">

                <h2>
                  <span className="section-icon">📋</span>
                  Business Information
                </h2>


                <div className="info-grid">

                  <InfoItem
                    label="Business Name"
                    value={
                      result.data.business_name
                    }
                    icon="🏢"
                  />


                  <InfoItem
                    label="Owner"
                    value={
                      result.data.owner_name
                    }
                    icon="👤"
                  />


                  <InfoItem
                    label="Category"
                    value={
                      result.data.category
                    }
                    icon="📁"
                  />


                  <InfoItem
                    label="Location"
                    value={
                      result.data.location
                    }
                    icon="📍"
                  />


                  <InfoItem
                    label="Opening Hours"
                    value={
                      result.data.hours
                    }
                    icon="🕒"
                  />


                  <InfoItem
                    label="Contact"
                    value={
                      result.data.contact
                    }
                    icon="📞"
                  />

                </div>


                {/* Products and Services */}

                <div className="products-section">

                  <h3>
                    <span className="section-icon">🛍️</span>
                    Products & Services
                  </h3>


                  {result.data.products &&
                  result.data.products.length > 0 ? (

                    <div className="product-tags">

                      {result.data.products.map(
                        (product, index) => (

                          <span
                            className="product-tag"
                            key={index}
                            style={{
                              animationDelay: `${index * 0.08}s`,
                            }}
                          >

                            {product}

                          </span>

                        )
                      )}

                    </div>

                  ) : (

                    <p className="empty-text">

                      No products or services
                      mentioned.

                    </p>

                  )}

                </div>

              </section>
              </TiltCard>


              {/* Clarification */}

              {currentField && (

                <TiltCard className="tilt-wrapper" intensity={6}>
                <section className="clarification-card">

                  <h2>
                    <span className="section-icon">💬</span>
                    We need one more detail
                  </h2>


                  <p>
                    {questions[currentField]}
                  </p>


                  <input

                    type="text"

                    placeholder="Type your answer here..."

                    value={
                      clarificationAnswer
                    }

                    onChange={(event) =>
                      setClarificationAnswer(
                        event.target.value
                      )
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

                    className="btn-3d"

                    onClick={
                      handleClarificationSubmit
                    }

                    disabled={loading}

                  >

                    {loading
                      ? "Updating..."
                      : "Continue →"}

                  </button>


                </section>
                </TiltCard>

              )}


              {/* All Required Information Collected */}

              {!currentField &&

                result.missing_fields &&

                result.missing_fields.length === 0 && (

                  <TiltCard className="tilt-wrapper" intensity={4}>
                  <section className="success-card">

                    <div className="success-icon-3d">
                      <div className="success-checkmark">✓</div>
                    </div>

                    <h2>
                      All required
                      information collected!
                    </h2>


                    <p>

                      Your business information
                      is ready for the next step.

                    </p>


                    <button

                      className="btn-3d btn-generate"

                      onClick={
                        generateWebsiteContent
                      }

                      disabled={loading}

                    >

                      {loading ? (
                        <span className="btn-loading">
                          <span className="spinner" />
                          Creating your website...
                        </span>
                      ) : (
                        <span className="btn-content">
                          <span className="btn-icon">🚀</span>
                          Generate Website
                        </span>
                      )}

                    </button>


                    <button

                      className="start-again-button"

                      onClick={
                        handleStartAgain
                      }

                    >

                      ↺ Start Again

                    </button>


                  </section>
                  </TiltCard>

                )}

            </>

          )}


      </div>

    </div>

  );

}


// --------------------------------
// Information Item Component
// --------------------------------

function InfoItem({
  label,
  value,
  icon,
}) {

  return (

    <div className="info-item">

      {icon && (
        <span className="info-icon">{icon}</span>
      )}

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