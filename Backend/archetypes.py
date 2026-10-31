"""
MakeSite AI - Industry Archetype Engine (Backend)

Provides dedicated section architecture, structured data models, and specialized
HTML layouts for the 6 core business archetypes:
1. Salon & Spa: Services & treatment menu, duration & pricing, stylists, appointment booking
2. Café & Roastery: Categorized food/drink menu, roast spotlight, directions & transit, table reservation
3. Boutique & Fashion: Curated lookbook cards, fabric/craft story, private fitting scheduler
4. Tuition & Coaching: Academic stats, subjects/grades matrix, faculty, demo class admission form
5. Local Services & Trades: 24/7 emergency dispatch, fixed upfront rate cards, coverage area, dispatch request
6. Consultants & Advisory: Executive fiduciary header, practice pillars, case studies, discovery call scheduler
"""

import html
import re
from typing import Dict, Any, List


def escape(val: Any) -> str:
    """Safe HTML entity escape."""
    if val is None:
        return ""
    return html.escape(str(val))


def detect_industry_archetype(category: str = "", business_name: str = "", products: List[Any] = None) -> str:
    """
    Detects business archetype from category, name, and products.
    Returns: 'salon' | 'cafe' | 'boutique' | 'tuition' | 'local_service' | 'consultant' | 'general'
    """
    prod_text = " ".join([str(p) for p in (products or [])])
    text = f"{category} {business_name} {prod_text}".lower()

    if re.search(r"cafe|café|coffee|bakery|bistro|restaurant|food|pastry|roaster|tea|brew|diner|kitchen|espresso|chai|eatery|culinary|croissant|brunch|dining|snack|barista", text):
        return "cafe"
    if re.search(r"salon|spa|wellness|beauty|hair|massage|nail|skincare|barber|aesthetic|yoga|therapy|clinic|physio|facial|parlour|parlor|grooming|ayurveda", text):
        return "salon"
    if re.search(r"boutique|fashion|clothing|apparel|saree|garment|couture|dress|tailor|textile|wardrobe|jewelry|jewellery|luxury|accessories|style studio|lookbook|handicraft", text):
        return "boutique"
    if re.search(r"tuition|coaching|classes|tutor|teaching|education|academy|institute|learning|school|course|curriculum|iit|jee|neet|board exam|academics|mentor|study|training|maths|science", text):
        return "tuition"
    if re.search(r"plumb|electric|ac repair|hvac|mechanic|auto|garage|repair|cleaning|pest control|carpenter|painter|handyman|appliance|locksmith|contractor|maintenance|technician|installation", text):
        return "local_service"
    if re.search(r"consult|advisor|advisory|finance|financial|wealth|legal|lawyer|advocate|tax|accounting|fiduciary|audit|cpa|fund|asset|wealth management|attorney|management|corporate|coach|strategy", text):
        return "consultant"

    return "general"


def render_salon_sections(b_name: str, loc: str, hours: str, contact: str, products: List[Any]) -> str:
    """Renders Treatment Menu with duration/pricing, stylists roster, and appointment booking form."""
    durations = ["45 Mins", "60 Mins", "75 Mins", "90 Mins"]
    prices = ["₹799", "₹1,299", "₹1,899", "₹2,499"]
    treatment_items = products if products and len(products) >= 2 else [
        "Signature Botanical Hair Spa & Keratin Therapy",
        "Deep Cleansing Organic Facial & Glow Peel",
        "Aromatherapy Tension Release Massage",
        "Deluxe Gel Manicure & Pedicure Spa",
    ]

    treatment_cards = []
    for idx, item in enumerate(treatment_items):
        t_name = escape(item.get("name") if isinstance(item, dict) else item)
        t_desc = escape(item.get("description") if isinstance(item, dict) else "Restorative, sensory treatment customized for your hair and skin type using non-toxic botanical elixirs.")
        dur = durations[idx % len(durations)]
        prc = prices[idx % len(prices)]
        treatment_cards.append(f"""
        <div class="archetype-card">
          <div class="card-meta-row">
            <span class="badge-pill">⏱️ {dur}</span>
            <span class="badge-pill price-pill">{prc}</span>
          </div>
          <h3>{t_name}</h3>
          <p>{t_desc}</p>
          <div class="card-action-bar">
            <span class="card-subnote">Includes Aromatherapy Scalp Release</span>
            <a href="#book-appointment" class="btn-archetype-sm">Book This Slot &rarr;</a>
          </div>
        </div>""")

    cards_html = "\n".join(treatment_cards)

    return f"""
    <!-- SALON: STRUCTURED TREATMENT MENU -->
    <section id="treatment-menu" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">🌿 Sanctuary Treatment Menu & Rates</span>
        <h2>Restorative Care & Aesthetic Rituals</h2>
        <p>Unhurried botanical sessions designed to calm the nervous system, revive skin radiance, and nurture wellbeing.</p>
      </div>
      <div class="archetype-grid">
        {cards_html}
      </div>
    </section>

    <!-- SALON: MASTER STYLISTS -->
    <section id="stylists" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">✨ Dedicated Specialists</span>
        <h2>Master Artists & Therapists</h2>
        <p>Experienced professionals committed to unhurried, 1-on-1 personalized attention.</p>
      </div>
      <div class="archetype-grid grid-3">
        <div class="team-card">
          <div class="team-avatar">✂️</div>
          <h4>Priya Sharma</h4>
          <span class="team-role">Creative Hair Director • 9+ Yrs</span>
          <p>Specializes in precision cuts, dimensional balayage, and restorative keratin therapies.</p>
        </div>
        <div class="team-card">
          <div class="team-avatar">🌸</div>
          <h4>Ananya Mehta</h4>
          <span class="team-role">Master Esthetician • 7+ Yrs</span>
          <p>Certified in clinical organic facials, lymphatic drainage, and bridal glow treatments.</p>
        </div>
        <div class="team-card">
          <div class="team-avatar">🌿</div>
          <h4>David Fernandes</h4>
          <span class="team-role">Senior Massage Specialist • 11+ Yrs</span>
          <p>Expert in deep tissue tension release, Ayurvedic warm-oil therapy, and reflexology.</p>
        </div>
      </div>
    </section>

    <!-- SALON: HYGIENE & SANCTUARY STANDARDS -->
    <section id="hygiene" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">Sanctuary Standards</span>
        <h2>Clean Formulations & Clinical Hygiene</h2>
        <p>Hospital-grade tool sterilization, private soundproof suites, and 100% non-toxic organic botanical formulations.</p>
      </div>
      <div class="archetype-grid grid-3">
        <div class="story-card">
          <div class="team-avatar">🔬</div>
          <h4>Hospital-Grade Sterilization</h4>
          <p>Every metal instrument is autoclaved and sealed in individual pouches prior to each treatment.</p>
        </div>
        <div class="story-card">
          <div class="team-avatar">🌱</div>
          <h4>100% Clean Botanicals</h4>
          <p>Sulfate-free, cruelty-free, and paraben-free organic formulations that nourish skin and scalp.</p>
        </div>
        <div class="story-card">
          <div class="team-avatar">🚪</div>
          <h4>Private Quiet Suites</h4>
          <p>Climate-controlled private suites designed to calm sensory overload and restore calm.</p>
        </div>
      </div>
    </section>

    <!-- SALON: APPOINTMENT BOOKING WIDGET -->
    <section id="book-appointment" class="archetype-booking-panel">
      <div class="booking-inner">
        <span class="sec-badge">📅 Priority Scheduling</span>
        <h2>Book Your Treatment Appointment</h2>
        <p>Reserve your preferred specialist and time slot. We confirm via WhatsApp / Call within 30 minutes.</p>
        
        <form class="archetype-interactive-form" onsubmit="event.preventDefault(); alert('✓ Appointment request received for {b_name}! Our receptionist will confirm your slot via call/WhatsApp.');">
          <div class="form-grid">
            <div class="form-group">
              <label>Select Treatment</label>
              <select required>
                <option value="">-- Choose Desired Treatment --</option>
                {"".join([f'<option value="{escape(t.get("name") if isinstance(t, dict) else t)}">{escape(t.get("name") if isinstance(t, dict) else t)}</option>' for t in treatment_items])}
              </select>
            </div>
            <div class="form-group">
              <label>Preferred Date</label>
              <input type="date" required />
            </div>
            <div class="form-group">
              <label>Preferred Time Window</label>
              <select required>
                <option value="morning">Morning (10:00 AM - 01:00 PM)</option>
                <option value="afternoon">Afternoon (01:00 PM - 05:00 PM)</option>
                <option value="evening">Evening (05:00 PM - 08:30 PM)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Your Name & Phone Number</label>
              <input type="text" placeholder="e.g. Maya Patel • 9876543210" required />
            </div>
          </div>
          <button type="submit" class="btn-primary-block">Confirm Appointment Request &rarr;</button>
          <p class="form-subtext">No upfront payment required. Dedicated quiet suite reserved under your name.</p>
        </form>
      </div>
    </section>"""


def render_cafe_sections(b_name: str, loc: str, hours: str, contact: str, products: List[Any]) -> str:
    """Renders Categorized Food & Beverage Menu, Roast Spotlight, Directions/Transit, and Table Reservation."""
    menu_items = products if products and len(products) >= 2 else [
        "Single-Origin Pour Over (Ethiopian Yirgacheffe)",
        "Oat Milk Velvet Flat White",
        "18-Hour Slow Brewed Cold Coffee",
        "Warm Flaky Butter Croissant",
        "Valrhona Pain au Chocolat",
        "Avocado Smash on Country Sourdough",
    ]

    menu_cards = []
    prices = ["₹210", "₹240", "₹190", "₹180", "₹220", "₹320"]
    tags = ["Roaster's Pick", "Vegan", "Cold Brew", "Fresh 7:30 AM", "Bestseller", "All-Day Brunch"]

    for idx, item in enumerate(menu_items):
        m_name = escape(item.get("name") if isinstance(item, dict) else item)
        m_desc = escape(item.get("description") if isinstance(item, dict) else "Freshly prepared in our small-batch kitchen using organic local ingredients and roasted beans.")
        prc = prices[idx % len(prices)]
        tag = tags[idx % len(tags)]
        menu_cards.append(f"""
        <div class="menu-item-row">
          <div class="menu-item-left">
            <div class="menu-item-header">
              <h4>{m_name}</h4>
              <span class="dietary-tag">{tag}</span>
            </div>
            <p>{m_desc}</p>
          </div>
          <div class="menu-item-price">{prc}</div>
        </div>""")

    menu_html = "\n".join(menu_cards)
    maps_query = escape(f"{b_name} {loc}").replace(" ", "+")

    return f"""
    <!-- CAFE: INTERACTIVE MENU -->
    <section id="cafe-menu" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">☕ The Daily Counter & Roastery Menu</span>
        <h2>Fresh Bakes & Specialty Roasts</h2>
        <p>Small-batch roasted beans with origin transparency, paired with slow-fermented hearth viennoiserie.</p>
      </div>
      <div class="menu-board-container">
        {menu_html}
      </div>
    </section>

    <!-- CAFE: TODAY'S ROAST SPOTLIGHT -->
    <section id="roast-spotlight" class="roast-spotlight-box">
      <div class="roast-inner">
        <span class="sec-badge">🔥 In-House Micro-Roastery</span>
        <h3>Today's Featured Roast: Monsooned Malabar & Sidama Blend</h3>
        <p>Dark chocolate notes with sweet mandarin acidity and roasted hazelnut finish. Altitude: 1,650m MASL.</p>
        <div class="roast-schedule-chips">
          <span>🥐 07:30 AM: Warm Viennoiserie Pull</span>
          <span>☕ All Day: Single-Origin Espresso</span>
          <span>🥖 11:30 AM: Sourdough Hearth Bakes</span>
        </div>
      </div>
    </section>

    <!-- CAFE: MAP, DIRECTIONS & TRANSIT -->
    <section id="directions" class="directions-section">
      <div class="directions-card">
        <div class="directions-info">
          <span class="sec-badge">📍 Visit Our Café</span>
          <h2>Finding Our Roastery & Kitchen</h2>
          <p class="address-callout"><strong>Address:</strong> {loc}</p>
          <div class="transit-tips">
            <p>🚶 <strong>Transit:</strong> 4-minute walk from Central Metro Station.</p>
            <p>🚗 <strong>Parking:</strong> Dedicated customer parking and bicycle docks in front.</p>
            <p>🕒 <strong>Hours:</strong> {hours}</p>
          </div>
          <div class="directions-actions">
            <a href="https://www.google.com/maps/search/?api=1&query={maps_query}" target="_blank" rel="noopener noreferrer" class="btn-primary-block">
              📍 Open Google Maps & Directions &rarr;
            </a>
            <a href="#table-reservation" class="btn-secondary-block">Reserve a Table Inside</a>
          </div>
        </div>
      </div>
    </section>

    <!-- CAFE: TABLE RESERVATION / PRE-ORDER -->
    <section id="table-reservation" class="archetype-booking-panel">
      <div class="booking-inner">
        <span class="sec-badge">🪑 Reserve Seating</span>
        <h2>Table Reservation & Takeaway Pre-Order</h2>
        <p>Avoid wait times during rush hours. We hold reserved tables for 15 minutes.</p>
        <form class="archetype-interactive-form" onsubmit="event.preventDefault(); alert('✓ Table request received! We look forward to welcoming you to {b_name}.');">
          <div class="form-grid">
            <div class="form-group">
              <label>Party Size</label>
              <select required>
                <option value="1">1 Person (Solo / Work Desk)</option>
                <option value="2" selected>2 People</option>
                <option value="4">3 - 4 People</option>
                <option value="6">5+ People (Group Table)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date & Time</label>
              <input type="datetime-local" required />
            </div>
            <div class="form-group">
              <label>Seating Preference</label>
              <select>
                <option value="indoor">Indoor (AC & Quiet)</option>
                <option value="patio">Outdoor Garden Patio</option>
                <option value="bar">Brew Bar Counter</option>
              </select>
            </div>
            <div class="form-group">
              <label>Guest Name & Mobile</label>
              <input type="text" placeholder="e.g. Rohan Sharma • 9876543210" required />
            </div>
          </div>
          <button type="submit" class="btn-primary-block">Reserve Table Now &rarr;</button>
        </form>
      </div>
    </section>"""


def render_boutique_sections(b_name: str, loc: str, hours: str, contact: str, products: List[Any]) -> str:
    """Renders Lookbook Gallery, Artisan Craft Story, and Private Fitting Suite reservation."""
    items = products if products and len(products) >= 2 else [
        "Hand-Embroidered Mulberry Silk Kurta",
        "Raw French Linen Relaxed Trench",
        "Block-Printed Organic Chanderi Saree",
        "Artisan Sterling Silver Statement Choker",
    ]

    fabrics = ["100% Handwoven Linen", "Pure Mulberry Silk", "Organic Chanderi Cotton", "92.5 Hallmarked Silver"]
    prices = ["₹3,890", "₹5,400", "₹6,900", "₹8,500"]
    badges = ["New Season", "Artisan Edit", "Bestseller", "Limited Edition"]

    lookbook_cards = []
    for idx, item in enumerate(items):
        p_name = escape(item.get("name") if isinstance(item, dict) else item)
        p_desc = escape(item.get("description") if isinstance(item, dict) else "Designed for effortless elegance with tailored seams and natural breathable fibers.")
        fab = fabrics[idx % len(fabrics)]
        prc = prices[idx % len(prices)]
        bdg = badges[idx % len(badges)]

        lookbook_cards.append(f"""
        <div class="lookbook-card">
          <div class="card-meta-row">
            <span class="badge-pill">{bdg}</span>
            <span class="badge-pill price-pill">{prc}</span>
          </div>
          <h3>{p_name}</h3>
          <span class="fabric-spec">🧵 {fab}</span>
          <p>{p_desc}</p>
          <div class="card-action-bar">
            <span class="card-subnote">Bespoke Fit Available</span>
            <a href="#private-fitting" class="btn-archetype-sm">Reserve for Try-On &rarr;</a>
          </div>
        </div>""")

    cards_html = "\n".join(lookbook_cards)

    return f"""
    <!-- BOUTIQUE: CURATED LOOKBOOK -->
    <section id="lookbook" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">✨ Curated Atelier Lookbook</span>
        <h2>Handcrafted Silhouettes & Textiles</h2>
        <p>Slow fashion crafted in limited editions with natural organic textiles and precision bespoke tailoring.</p>
      </div>
      <div class="archetype-grid">
        {cards_html}
      </div>
    </section>

    <!-- BOUTIQUE: ATELIER CRAFT STORY -->
    <section id="craft" class="craft-story-box">
      <div class="sec-header">
        <span class="sec-badge">🧵 The Atelier Standard</span>
        <h2>Crafted With Intention & Care</h2>
      </div>
      <div class="archetype-grid grid-3">
        <div class="story-card">
          <h4>Direct Artisan Clusters</h4>
          <p>We work directly with traditional weaving mastercraftsmen, ensuring fair living wages and pure provenance.</p>
        </div>
        <div class="story-card">
          <h4>Complimentary Alterations</h4>
          <p>Our master tailors provide custom alterations on every piece so the garment fits your form flawlessly.</p>
        </div>
        <div class="story-card">
          <h4>Zero Synthetic Waste</h4>
          <p>Biodegradable cotton, pure silk, and non-toxic botanical dyes. Fashion built to last generations.</p>
        </div>
      </div>
    </section>

    <!-- BOUTIQUE: PRIVATE FITTING ROOM -->
    <section id="fitting" class="archetype-booking-panel">
      <div class="booking-inner">
        <span class="sec-badge">👗 VIP In-Store Experience</span>
        <h2>Book a Private Styling & Fitting Room</h2>
        <p>Enjoy a dedicated trial suite with a personal stylist and complimentary espresso or tea.</p>
        <form class="archetype-interactive-form" onsubmit="event.preventDefault(); alert('✓ Fitting suite reserved at {b_name}! Our stylist will prepare your selected pieces.');">
          <div class="form-grid">
            <div class="form-group">
              <label>Pieces / Collection of Interest</label>
              <input type="text" placeholder="e.g. Sarees, Festive Kurtas, Linen Wear" required />
            </div>
            <div class="form-group">
              <label>Preferred Fitting Date</label>
              <input type="date" required />
            </div>
            <div class="form-group">
              <label>Preferred Time Slot</label>
              <select required>
                <option value="noon">11:00 AM - 02:00 PM</option>
                <option value="afternoon">02:00 PM - 05:00 PM</option>
                <option value="evening">05:00 PM - 08:00 PM</option>
              </select>
            </div>
            <div class="form-group">
              <label>Your Name & Contact Number</label>
              <input type="text" placeholder="e.g. Meera Kapoor • 9876543210" required />
            </div>
          </div>
          <button type="submit" class="btn-primary-block">Reserve In-Store Trial Room &rarr;</button>
        </form>
      </div>
    </section>"""


def render_tuition_sections(b_name: str, loc: str, hours: str, contact: str, products: List[Any]) -> str:
    """Renders Academic Results, Curriculum & Subjects Matrix, Faculty, and Demo Class Form."""
    courses = [
        {
            "grade": "Class 9 - 10 Foundation Batch",
            "subjects": "Pure Mathematics, Physics, Chemistry, Biology",
            "schedule": "Mon, Wed, Fri (4:30 PM - 6:30 PM)",
            "features": "Board exam rigor, weekly diagnostic tests, and personalized doubt sessions.",
        },
        {
            "grade": "Class 11 - 12 Board & Entrance",
            "subjects": "Advanced Mathematics, Physics & Organic Chemistry",
            "schedule": "Tue, Thu, Sat (5:00 PM - 7:30 PM)",
            "features": "Numerical workshops, 15-year past paper mastery, and board distinction roadmap.",
        },
        {
            "grade": "Target Competitive Wing (JEE / NEET)",
            "subjects": "Speed-Accuracy Drills & Advanced Problem Solving",
            "schedule": "Sunday Weekend Marathons (9:00 AM - 1:00 PM)",
            "features": "National test series, negative-marking prevention, and full mock simulations.",
        },
    ]

    course_cards = []
    for c in courses:
        course_cards.append(f"""
        <div class="curriculum-card">
          <div class="card-meta-row">
            <span class="badge-pill">{c['grade']}</span>
            <span class="badge-pill price-pill">Max 15 / Batch</span>
          </div>
          <h3>{c['subjects']}</h3>
          <p class="batch-time">🕒 <strong>Schedule:</strong> {c['schedule']}</p>
          <p>{c['features']}</p>
          <a href="#demo-class" class="btn-archetype-sm">Enroll / Request Syllabus &rarr;</a>
        </div>""")

    curriculum_html = "\n".join(course_cards)

    return f"""
    <!-- TUITION: ACADEMIC RESULTS COUNTERS -->
    <section id="results" class="results-stats-section">
      <div class="results-grid">
        <div class="stat-card">
          <span class="stat-num">98.4%</span>
          <span class="stat-lbl">Average Board Distinction</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">500+</span>
          <span class="stat-lbl">Students Mentored</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">95+</span>
          <span class="stat-lbl">Average Math & Science Score</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">15</span>
          <span class="stat-lbl">Strict Cap per Batch</span>
        </div>
      </div>
    </section>

    <!-- TUITION: SUBJECTS & CURRICULUM -->
    <section id="curriculum" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">📚 Structured Academic Programs</span>
        <h2>Curriculum & Batch Timings</h2>
        <p>Concept clarity without rote learning. Structured weekly schedules designed for top academic ranks.</p>
      </div>
      <div class="archetype-grid grid-3">
        {curriculum_html}
      </div>
    </section>

    <!-- TUITION: FACULTY MENTORS -->
    <section id="faculty" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">👨‍🏫 Experienced Mentors</span>
        <h2>Meet Our Senior Faculty</h2>
      </div>
      <div class="archetype-grid grid-3">
        <div class="team-card">
          <div class="team-avatar">📐</div>
          <h4>Prof. Rajesh Verma</h4>
          <span class="team-role">Head of Mathematics • 14+ Yrs Exp</span>
          <p>M.Sc. Mathematics. Has mentored over 40 state board Olympiad medalists.</p>
        </div>
        <div class="team-card">
          <div class="team-avatar">⚡</div>
          <h4>Dr. Sunita Rao</h4>
          <span class="team-role">Lead Physics Mentor • Ph.D.</span>
          <p>Specializes in intuitive visualization of mechanics and electromagnetism.</p>
        </div>
        <div class="team-card">
          <div class="team-avatar">🧪</div>
          <h4>Er. Amit Saxena</h4>
          <span class="team-role">Chemistry Faculty • B.Tech IIT</span>
          <p>Simplifies Organic Chemistry roadmaps and reaction mechanisms for high scores.</p>
        </div>
      </div>
    </section>

    <!-- TUITION: DEMO CLASS ENQUIRY FORM -->
    <section id="demo-class" class="archetype-booking-panel">
      <div class="booking-inner">
        <span class="sec-badge">🎯 Risk-Free Trial</span>
        <h2>Book a Free 2-Day Trial / Demo Class</h2>
        <p>Experience our teaching methodology firsthand before formal admission.</p>
        <form class="archetype-interactive-form" onsubmit="event.preventDefault(); alert('✓ Demo class seat reserved at {b_name}! Our academic counselor will call you with batch details.');">
          <div class="form-grid">
            <div class="form-group">
              <label>Student Full Name</label>
              <input type="text" placeholder="e.g. Aryan Sharma" required />
            </div>
            <div class="form-group">
              <label>Current Class / Grade</label>
              <select required>
                <option value="9">Class 9 (CBSE / ICSE / State)</option>
                <option value="10">Class 10 Board Wing</option>
                <option value="11">Class 11 Science</option>
                <option value="12">Class 12 Boards + JEE/NEET</option>
              </select>
            </div>
            <div class="form-group">
              <label>Subject of Priority Interest</label>
              <input type="text" placeholder="e.g. Mathematics & Physics" required />
            </div>
            <div class="form-group">
              <label>Parent Mobile Number</label>
              <input type="tel" placeholder="e.g. 9876543210" required />
            </div>
          </div>
          <button type="submit" class="btn-primary-block">Reserve Free Demo Seat &rarr;</button>
        </form>
      </div>
    </section>"""


def render_local_service_sections(b_name: str, loc: str, hours: str, contact: str, products: List[Any]) -> str:
    """Renders Emergency Dispatch ribbon, Fixed Upfront Rate Card, Coverage Area, and Dispatch Form."""
    repairs = products if products and len(products) >= 2 else [
        "Emergency Pipe Burst & Leak Repair",
        "AC Full Jet Cleaning & Gas Top-Up",
        "Circuit Breaker & Short Circuit Fixing",
        "Complete Drain Unclogging & Jetting",
    ]

    prices = ["₹299", "₹499", "₹349", "₹599"]
    durations = ["~30 Mins", "~45 Mins", "~40 Mins", "~60 Mins"]

    rate_cards = []
    for idx, r in enumerate(repairs):
        r_name = escape(r.get("name") if isinstance(r, dict) else r)
        r_desc = escape(r.get("description") if isinstance(r, dict) else "Full on-site diagnostic, licensed technician labor, OEM parts check, and post-repair safety testing.")
        prc = prices[idx % len(prices)]
        dur = durations[idx % len(durations)]

        rate_cards.append(f"""
        <div class="archetype-card">
          <div class="card-meta-row">
            <span class="badge-pill">⏱️ {dur}</span>
            <span class="badge-pill price-pill">{prc} Upfront</span>
          </div>
          <h3>{r_name}</h3>
          <p>{r_desc}</p>
          <div class="card-action-bar">
            <span class="card-subnote">🛡️ 90-Day Repair Guarantee</span>
            <a href="#dispatch-form" class="btn-archetype-sm">Request This Repair &rarr;</a>
          </div>
        </div>""")

    cards_html = "\n".join(rate_cards)
    tel_link = f"tel:{contact.replace(' ', '')}" if contact else "#dispatch-form"

    return f"""
    <!-- LOCAL SERVICE: 24/7 EMERGENCY BANNER -->
    <div id="emergency-ribbon" class="emergency-alert-banner">
      <div class="emergency-inner">
        <span class="emergency-dot">●</span>
        <span><strong>24/7 EMERGENCY STANDBY:</strong> Technicians on call across {loc}. Average arrival time: 38 mins.</span>
        <a href="{tel_link}" class="btn-emergency-call">🚨 Call Dispatch: {contact or "Click Here"}</a>
      </div>
    </div>

    <!-- LOCAL SERVICE: FIXED RATE CARD -->
    <section id="pricing-guide" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">🏷️ Transparent Pricing</span>
        <h2>Common Diagnostics & Fixed Rate Card</h2>
        <p>No unexpected bills or surprise charges. Upfront estimate approved before work starts.</p>
      </div>
      <div class="archetype-grid">
        {cards_html}
      </div>
    </section>

    <!-- LOCAL SERVICE: COVERAGE AREA & GUARANTEES -->
    <section id="coverage" class="coverage-section">
      <div class="sec-header">
        <span class="sec-badge">📍 Service Area & Guarantees</span>
        <h2>Neighborhood Dispatch Radius</h2>
        <p>Covering all communities and postal sectors within 25 km of {loc}.</p>
      </div>
      <div id="guarantees" class="archetype-grid grid-3">
        <div class="story-card">
          <h4>👨‍🔧 Police-Verified Techs</h4>
          <p>Every technician carries photo ID, licensed trade certifications, and background verification.</p>
        </div>
        <div class="story-card">
          <h4>🔩 Genuine Spare Parts</h4>
          <p>We use only factory sealed, brand-certified parts backed by manufacturer warranty.</p>
        </div>
        <div class="story-card">
          <h4>🛡️ 90-Day Warranty</h4>
          <p>If the same problem occurs within 90 days, we return and fix it 100% free of charge.</p>
        </div>
      </div>
    </section>

    <!-- LOCAL SERVICE: DISPATCH FORM -->
    <section id="dispatch-form" class="archetype-booking-panel">
      <div class="booking-inner">
        <span class="sec-badge">⚡ Fast Dispatch</span>
        <h2>Request a Technician On-Site</h2>
        <p>Fill out your issue details below for immediate dispatch confirmation.</p>
        <form class="archetype-interactive-form" onsubmit="event.preventDefault(); alert('✓ Dispatch alert sent to nearest technician for {b_name}! You will receive an arrival ETA shortly.');">
          <div class="form-grid">
            <div class="form-group">
              <label>Service / Problem Type</label>
              <input type="text" placeholder="e.g. Water leak, AC not cooling, Short circuit" required />
            </div>
            <div class="form-group">
              <label>Urgency Level</label>
              <select required>
                <option value="urgent">🚨 Immediate / Emergency (Under 45 mins)</option>
                <option value="today">Today (Within 2 - 4 hours)</option>
                <option value="scheduled">Scheduled for Tomorrow / Specific Time</option>
              </select>
            </div>
            <div class="form-group">
              <label>Your Complete Address & Landmark</label>
              <input type="text" placeholder="House/Flat No., Street, Landmark in {loc}" required />
            </div>
            <div class="form-group">
              <label>Your Phone Number</label>
              <input type="tel" placeholder="e.g. 9876543210" required />
            </div>
          </div>
          <button type="submit" class="btn-primary-block">Dispatch Nearest Technician &rarr;</button>
        </form>
      </div>
    </section>"""


def render_consultant_sections(b_name: str, loc: str, hours: str, contact: str, products: List[Any]) -> str:
    """Renders Fiduciary Pillars, Anonymized Case Studies, Credentials, and Discovery Call Scheduler."""
    pillars = products if products and len(products) >= 2 else [
        "Private Wealth & Multi-Gen Family Office Mandates",
        "Corporate Tax Structuring & Cross-Border Compliance",
        "Fiduciary Risk Advisory & Succession Frameworks",
        "Business Valuation & Strategic Capitalization",
    ]

    deliverables = [
        "Asset allocation architecture, risk mitigation, and generational wealth preservation.",
        "Corporate legal structuring to optimize tax liabilities while ensuring statutory compliance.",
        "Family governance trusts, power of attorney mandates, and executive continuity.",
        "Cash flow modeling, capitalization strategy, and buy-side advisory.",
    ]

    pillar_cards = []
    for idx, p in enumerate(pillars):
        p_name = escape(p.get("name") if isinstance(p, dict) else p)
        deliv = deliverables[idx % len(deliverables)]
        pillar_cards.append(f"""
        <div class="archetype-card">
          <span class="badge-pill">Pillar 0{idx + 1}</span>
          <h3>{p_name}</h3>
          <p>{deliv}</p>
          <div class="card-action-bar">
            <span class="card-subnote">Standard: Quarterly Fiduciary Review</span>
            <a href="#discovery-call" class="btn-archetype-sm">Inquire Mandate &rarr;</a>
          </div>
        </div>""")

    pillars_html = "\n".join(pillar_cards)

    return f"""
    <!-- CONSULTANT: SWORN FIDUCIARY OATH -->
    <section id="fiduciary-oath" class="roast-spotlight-box" style="border-color: rgba(217, 119, 6, 0.35); background: rgba(217, 119, 6, 0.08);">
      <div class="roast-inner">
        <span class="sec-badge">⚖️ The Fiduciary Standard of Care</span>
        <h3>Independent Mandates & Capital Governance</h3>
        <p>Legally sworn duty of loyalty: zero undisclosed commissions, transparent retainers, and fiduciary architectures tailored strictly to your generational wellbeing.</p>
      </div>
    </section>

    <!-- CONSULTANT: ADVISORY PRACTICE PILLARS -->
    <section id="practice-areas" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">⚖️ Strategic Practice Areas</span>
        <h2>Fiduciary Solutions & Advisory Mandates</h2>
        <p>Independent capital stewardship unburdened by institutional conflicts of interest. Strict legal duty of loyalty to your goals.</p>
      </div>
      <div class="archetype-grid">
        {pillars_html}
      </div>
    </section>

    <!-- CONSULTANT: TRACK RECORD CASE STUDIES -->
    <section id="case-studies" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">📊 Demonstrated Track Record</span>
        <h2>Verified Client Impact (Anonymized)</h2>
      </div>
      <div class="archetype-grid grid-3">
        <div class="case-study-card">
          <span class="case-metric">34% Tax Reduction</span>
          <h4>Regional Enterprise Restructuring</h4>
          <p>Consolidated holding entities to optimize intercompany transactions and eliminate double taxation exposure.</p>
        </div>
        <div class="case-study-card">
          <span class="case-metric">$18M Governance</span>
          <h4>Multi-Gen Family Office Trust</h4>
          <p>Drafted irrevocable family constitution and asset protection mandate for 3rd generation leadership transition.</p>
        </div>
        <div class="case-study-card">
          <span class="case-metric">100% Audit Clearance</span>
          <h4>Statutory Risk Audit</h4>
          <p>Guided mid-market corporate through complete compliance overhaul with zero regulatory penalties.</p>
        </div>
      </div>
    </section>

    <!-- CONSULTANT: SENIOR CREDENTIALS -->
    <section id="credentials" class="archetype-section">
      <div class="sec-header">
        <span class="sec-badge">📜 Professional Credentials</span>
        <h2>Fiduciary Designations & Standards</h2>
      </div>
      <div class="archetype-grid grid-3">
        <div class="story-card">
          <h4>Chartered Designations</h4>
          <p>CPA, CFA Charterholder, Master of Laws (LL.M). Rigorous statutory ethics certification.</p>
        </div>
        <div class="story-card">
          <h4>15+ Years Mandate Leadership</h4>
          <p>Advisory counsel across cross-border mergers, family holding entities, and corporate boards.</p>
        </div>
        <div class="story-card">
          <h4>Zero Kickback Guarantee</h4>
          <p>We receive 100% of our compensation from clients—never from financial product vendors.</p>
        </div>
      </div>
    </section>

    <!-- CONSULTANT: DISCOVERY CALL SCHEDULER -->
    <section id="discovery-call" class="archetype-booking-panel">
      <div class="booking-inner">
        <span class="sec-badge">🤝 Confidential Briefing</span>
        <h2>Schedule a 15-Minute Strategy Discovery Call</h2>
        <p>Explore your objectives in a private, confidential introductory consultation under mutual NDA.</p>
        <form class="archetype-interactive-form" onsubmit="event.preventDefault(); alert('✓ Discovery consultation request received for {b_name}! You will receive an invitation link on your email/phone.');">
          <div class="form-grid">
            <div class="form-group">
              <label>Advisory Objective</label>
              <select required>
                <option value="wealth">Private Wealth & Asset Structuring</option>
                <option value="tax">Corporate Tax Planning & Compliance</option>
                <option value="succession">Family Trust & Succession Planning</option>
                <option value="corporate">Corporate Strategy & Governance</option>
              </select>
            </div>
            <div class="form-group">
              <label>Preferred Consultation Date</label>
              <input type="date" required />
            </div>
            <div class="form-group">
              <label>Your Full Name & Title</label>
              <input type="text" placeholder="e.g. Vikram Malhotra, Managing Director" required />
            </div>
            <div class="form-group">
              <label>Corporate Email / Direct Phone</label>
              <input type="text" placeholder="e.g. vikram@enterprise.com • 9876543210" required />
            </div>
          </div>
          <button type="submit" class="btn-primary-block">Confirm Strategy Call Request &rarr;</button>
          <p class="form-subtext">All communications strictly governed by professional non-disclosure standards.</p>
        </form>
      </div>
    </section>"""


def get_archetype_html_sections(
    category: str,
    business_name: str,
    location: str,
    hours: str,
    contact: str,
    products: List[Any],
) -> Dict[str, str]:
    """
    Returns archetype identifier and generated HTML blocks for insertion into templates.
    """
    archetype = detect_industry_archetype(category, business_name, products)

    if archetype == "salon":
        return {
            "archetype": "salon",
            "nav_cta": "Book Appointment",
            "hero_cta": "Book Treatment Slot",
            "hero_target": "#book-appointment",
            "body_sections": render_salon_sections(business_name, location, hours, contact, products),
        }
    elif archetype == "cafe":
        return {
            "archetype": "cafe",
            "nav_cta": "Reserve Table",
            "hero_cta": "View Food & Drink Menu",
            "hero_target": "#cafe-menu",
            "body_sections": render_cafe_sections(business_name, location, hours, contact, products),
        }
    elif archetype == "boutique":
        return {
            "archetype": "boutique",
            "nav_cta": "Book Private Fitting",
            "hero_cta": "Explore Lookbook",
            "hero_target": "#lookbook",
            "body_sections": render_boutique_sections(business_name, location, hours, contact, products),
        }
    elif archetype == "tuition":
        return {
            "archetype": "tuition",
            "nav_cta": "Book Free Demo",
            "hero_cta": "Book Free Demo Class",
            "hero_target": "#demo-class",
            "body_sections": render_tuition_sections(business_name, location, hours, contact, products),
        }
    elif archetype == "local_service":
        return {
            "archetype": "local_service",
            "nav_cta": "🚨 Emergency Dispatch",
            "hero_cta": f"Call On-Duty Tech: {contact}" if contact else "Request Emergency Dispatch",
            "hero_target": f"tel:{contact.replace(' ', '')}" if contact else "#dispatch-form",
            "body_sections": render_local_service_sections(business_name, location, hours, contact, products),
        }
    elif archetype == "consultant":
        return {
            "archetype": "consultant",
            "nav_cta": "Schedule Discovery Call",
            "hero_cta": "Schedule 15-Min Discovery Call",
            "hero_target": "#discovery-call",
            "body_sections": render_consultant_sections(business_name, location, hours, contact, products),
        }
    else:
        return {
            "archetype": "general",
            "nav_cta": "Contact Us",
            "hero_cta": "Get In Touch",
            "hero_target": "#contact",
            "body_sections": "",
        }
