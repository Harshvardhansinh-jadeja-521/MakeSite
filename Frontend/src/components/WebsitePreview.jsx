import "./WebsitePreview.css";

function WebsitePreview({ businessData, template = "modern", onBack }) {
  const businessName =
    businessData.business_name || "Your Business";

  const category =
    businessData.category || "Business";

  const location =
    businessData.location || "Your Location";

  const products =
    businessData.products || [];

  // --------------------------------
  // Modern Template
  // --------------------------------

  if (template === "modern") {
    return (
      <div className="website-preview modern-template">

        <nav className="website-nav">
          <h2>{businessName}</h2>

          <div className="nav-links">
            <span>Home</span>
            <span>About</span>
            <span>Services</span>
            <span>Contact</span>
          </div>
        </nav>

        <section className="hero-section">
          <p className="category">
            {category}
          </p>

          <h1>
            Welcome to {businessName}
          </h1>

          <p className="hero-text">
            Your trusted {category} in {location}.
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
            Welcome to {businessName}. We are proud
            to serve customers in {location}.
          </p>
        </section>

        {products.length > 0 && (
          <section className="services-section">
            <h2>Our Services</h2>

            <div className="services-grid">
              {products.map((product, index) => (
                <div
                  className="service-card"
                  key={index}
                >
                  <h3>{product}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        <ContactSection businessData={businessData} />

        <Footer businessName={businessName} />

        <BackButton onBack={onBack} />

      </div>
    );
  }

  // --------------------------------
  // Minimal Template
  // --------------------------------

  if (template === "minimal") {
    return (
      <div className="website-preview minimal-template">

        <nav className="minimal-nav">
          <h2>{businessName}</h2>

          <div>
            <span>About</span>
            <span>Services</span>
            <span>Contact</span>
          </div>
        </nav>

        <section className="minimal-hero">

          <p>{category}</p>

          <h1>{businessName}</h1>

          <div className="minimal-line"></div>

          <p>
            A simple and reliable {category}
            serving {location}.
          </p>

        </section>

        <section className="minimal-about">

          <h2>About</h2>

          <p>
            {businessName} is located in {location}
            and is dedicated to serving its customers
            with quality products and services.
          </p>

        </section>

        {products.length > 0 && (
          <section className="minimal-services">

            <h2>What We Offer</h2>

            <div className="minimal-service-list">

              {products.map((product, index) => (
                <div
                  className="minimal-service"
                  key={index}
                >
                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3>{product}</h3>
                </div>
              ))}

            </div>

          </section>
        )}

        <section className="minimal-contact">

          <h2>Get in Touch</h2>

          <p>{location}</p>

          {businessData.hours && (
            <p>{businessData.hours}</p>
          )}

          {businessData.contact && (
            <p>{businessData.contact}</p>
          )}

        </section>

        <footer className="minimal-footer">
          © 2026 {businessName}
        </footer>

        <BackButton onBack={onBack} />

      </div>
    );
  }

  // --------------------------------
  // Bold Template
  // --------------------------------

  if (template === "bold") {
    return (
      <div className="website-preview bold-template">

        <nav className="bold-nav">

          <h2>{businessName}</h2>

          <div>
            <span>Home</span>
            <span>Services</span>
            <span>Contact</span>
          </div>

        </nav>

        <section className="bold-hero">

          <div className="bold-category">
            {category}
          </div>

          <h1>
            WE MAKE
            <br />
            BUSINESS
            <br />
            <span>STAND OUT.</span>
          </h1>

          <p>
            {businessName} — {location}
          </p>

          {businessData.contact && (
            <button className="bold-button">
              Contact Us →
            </button>
          )}

        </section>

        <section className="bold-about">

          <div className="bold-number">
            01
          </div>

          <div>
            <h2>About {businessName}</h2>

            <p>
              We provide reliable {category}
              services to customers in {location}.
            </p>
          </div>

        </section>

        {products.length > 0 && (
          <section className="bold-services">

            <div className="bold-section-title">
              <span>02</span>
              <h2>OUR SERVICES</h2>
            </div>

            <div className="bold-service-grid">

              {products.map((product, index) => (
                <div
                  className="bold-service-card"
                  key={index}
                >
                  <span>
                    0{index + 1}
                  </span>

                  <h3>{product}</h3>

                  <p>
                    Professional and reliable
                    service for our customers.
                  </p>
                </div>
              ))}

            </div>

          </section>
        )}

        <section className="bold-contact">

          <div className="bold-section-title">
            <span>03</span>
            <h2>CONTACT</h2>
          </div>

          <div className="bold-contact-info">

            <p>
              <strong>Location</strong>
              {location}
            </p>

            {businessData.hours && (
              <p>
                <strong>Hours</strong>
                {businessData.hours}
              </p>
            )}

            {businessData.contact && (
              <p>
                <strong>Contact</strong>
                {businessData.contact}
              </p>
            )}

          </div>

        </section>

        <footer className="bold-footer">
          <h2>{businessName}</h2>

          <p>
            © 2026 All rights reserved.
          </p>
        </footer>

        <BackButton onBack={onBack} />

      </div>
    );
  }

  return null;
}


// --------------------------------
// Reusable Contact Section
// --------------------------------

function ContactSection({ businessData }) {
  return (
    <section className="contact-section">

      <h2>Visit or Contact Us</h2>

      <div className="contact-info">

        <p>
          📍 {businessData.location || "Location not provided"}
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
  );
}


// --------------------------------
// Reusable Footer
// --------------------------------

function Footer({ businessName }) {
  return (
    <footer className="website-footer">

      <p>
        © 2026 {businessName}
      </p>

    </footer>
  );
}


// --------------------------------
// Back Button
// --------------------------------

function BackButton({ onBack }) {
  return (
    <button
      className="back-button"
      onClick={onBack}
    >
      ← Back
    </button>
  );
}


export default WebsitePreview;