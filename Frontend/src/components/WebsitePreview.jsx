import "./WebsitePreview.css";

function WebsitePreview({ businessData, onBack }) {
  return (
    <div className="website-preview">

      <nav className="website-nav">
        <h2>{businessData.business_name}</h2>

        <div className="nav-links">
          <span>Home</span>
          <span>About</span>
          <span>Services</span>
          <span>Contact</span>
        </div>
      </nav>


      <section className="hero-section">

        <p className="category">
          {businessData.category}
        </p>

        <h1>
          Welcome to {businessData.business_name}
        </h1>

        <p className="hero-text">
          Your trusted {businessData.category} in{" "}
          {businessData.location}.
        </p>

        {businessData.contact && (
          <button className="contact-button">
            Contact Us
          </button>
        )}

      </section>


      <section className="about-section">

        <h2>About Us</h2>

        <p>
          Welcome to {businessData.business_name}.
          We are proud to serve customers in{" "}
          {businessData.location}.
        </p>

      </section>


      {businessData.products &&
        businessData.products.length > 0 && (

          <section className="services-section">

            <h2>Our Services</h2>

            <div className="services-grid">

              {businessData.products.map(
                (product, index) => (

                  <div
                    className="service-card"
                    key={index}
                  >
                    <h3>{product}</h3>
                  </div>

                )
              )}

            </div>

          </section>

        )}


      <section className="contact-section">

        <h2>Visit or Contact Us</h2>

        <div className="contact-info">

          <p>
            📍 {businessData.location}
          </p>

          {businessData.hours && (
            <p>
              🕒 {businessData.hours}
            </p>
          )}

          {businessData.contact && (
            <p>
              📞 {businessData.contact}
            </p>
          )}

        </div>

      </section>


      <footer className="website-footer">

        <p>
          © 2026 {businessData.business_name}
        </p>

      </footer>


      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Business Information
      </button>

    </div>
  );
}

export default WebsitePreview;