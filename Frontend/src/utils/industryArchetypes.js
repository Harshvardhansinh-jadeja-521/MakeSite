/**
 * MakeSite Industry Archetypes Engine
 * 
 * Provides bespoke layouts, section structures, and dedicated interactive actions
 * for the 6 primary local business archetypes:
 * 1. Salons & Spas: Services & treatment menu, duration/price cards, stylist showcase, appointment booking
 * 2. Cafés & Roasteries: Categorized food & drink menu, daily roast spotlight, directions & transit, table reservation
 * 3. Boutiques & Fashion: Curated lookbook cards, artisan fabric provenance, private fitting room reservation
 * 4. Tuition & Coaching: Results stats, subjects & grade matrix, batch schedules, faculty credentials, demo class form
 * 5. Local Services & Trades: 24/7 emergency dispatch, fixed upfront rate cards, coverage radius, dispatch request
 * 6. Consultants & Advisory: Executive fiduciary header, advisory practice pillars, case studies, discovery call scheduler
 */

export function detectIndustryArchetype(category = "", businessName = "", products = []) {
  const text = `${category} ${businessName} ${Array.isArray(products) ? products.join(" ") : ""}`.toLowerCase();

  // 1. Café & Roasteries / Bakeries / Food
  if (text.match(/cafe|café|coffee|bakery|bistro|restaurant|food|pastry|roaster|tea|brew|diner|kitchen|espresso|chai|eatery|culinary|croissant|brunch|dining|snack|barista/)) {
    return "cafe";
  }

  // 2. Salon & Spa / Wellness / Aesthetics
  if (text.match(/salon|spa|wellness|beauty|hair|massage|nail|skincare|barber|aesthetic|yoga|therapy|clinic|physio|facial|parlour|parlor|grooming|ayurveda/)) {
    return "salon";
  }

  // 3. Boutique / Fashion / Artisan Apparel
  if (text.match(/boutique|fashion|clothing|apparel|saree|garment|couture|dress|tailor|textile|wardrobe|jewelry|jewellery|luxury|accessories|style studio|lookbook|handicraft/)) {
    return "boutique";
  }

  // 4. Tuition / Coaching / Academics
  if (text.match(/tuition|coaching|classes|tutor|teaching|education|academy|institute|learning|school|course|curriculum|iit|jee|neet|board exam|academics|mentor|study|training|maths|science/)) {
    return "tuition";
  }

  // 5. Local Services / Trades / Home Repairs
  if (text.match(/plumb|electric|ac repair|hvac|mechanic|auto|garage|repair|cleaning|pest control|carpenter|painter|handyman|appliance|locksmith|contractor|maintenance|technician|installation/)) {
    return "local_service";
  }

  // 6. Consultants / Advisory / Legal / Financial
  if (text.match(/consult|advisor|advisory|finance|financial|wealth|legal|lawyer|advocate|tax|accounting|fiduciary|audit|cpa|fund|asset|wealth management|attorney|management|corporate|coach|strategy/)) {
    return "consultant";
  }

  return "general";
}

/**
 * Returns tailored archetype configuration, navigation links, and default section content.
 */
export function getArchetypeConfig(archetype, businessData = {}, content = {}) {
  const bName = businessData.business_name || "Your Business";
  const loc = businessData.location || "Central Location";
  const contact = businessData.contact || "";
  const hours = businessData.hours || "Mon - Sat: 9:00 AM - 8:00 PM";
  const rawProducts = businessData.products || [];

  switch (archetype) {
    // =========================================================================
    // 1. SALON & SPA
    // =========================================================================
    case "salon":
      return {
        id: "salon",
        label: "Salon & Sanctuary Spa",
        badge: "🌿 APPOINTMENT BOOKING OPEN • 4.9 ★ RATING",
        heroCta: "Book Treatment Slot",
        heroCtaTarget: "book-appointment",
        heroSecondaryCta: "Call Front Desk",
        heroSecondaryTarget: contact ? `tel:${contact.replace(/[^0-9+]/g, "")}` : "contact",
        navLinks: [
          { label: "Treatments & Rates", target: "treatment-menu" },
          { label: "Our Stylists", target: "stylists" },
          { label: "Hygiene Standards", target: "hygiene" },
          { label: "Book Slot", target: "book-appointment", isCta: true },
        ],
        highlights: [
          { icon: "✨", text: "Private Soundproof Suites" },
          { icon: "🌿", text: "100% Organic Botanicals" },
          { icon: "⏱️", text: "1-on-1 Master Specialist Time" },
        ],
        treatmentMenu: (rawProducts.length >= 2 ? rawProducts : [
          "Signature Botanical Hair Spa & Keratin",
          "Deep Cleansing Organic Facial & Glow Peel",
          "Aromatherapy Tension Release Massage",
          "Deluxe Gel Manicure & Pedicure Spa"
        ]).map((item, idx) => {
          const name = typeof item === "string" ? item : item.name || `Treatment ${idx + 1}`;
          const durations = ["45 Mins", "60 Mins", "75 Mins", "90 Mins"];
          const prices = ["₹799", "₹1,299", "₹1,899", "₹2,499"];
          return {
            name,
            duration: durations[idx % durations.length],
            price: prices[idx % prices.length],
            category: idx % 2 === 0 ? "Hair & Aesthetics" : "Holistic Spa & Rituals",
            description: `Restorative, sensory treatment customized for your hair and skin type using non-toxic botanical elixirs.`,
          };
        }),
        stylists: [
          { name: "Priya Sharma", role: "Creative Hair Director", exp: "9+ Yrs Exp", spec: "Precision Cuts & Balayage" },
          { name: "Ananya Mehta", role: "Master Esthetician", exp: "7+ Yrs Exp", spec: "Clinical Glow & Botanical Facials" },
          { name: "David Fernandes", role: "Senior Massage Therapist", exp: "11+ Yrs Exp", spec: "Deep Tissue & Hot Stone" },
        ],
        hygieneGuarantees: [
          { icon: "🔬", title: "Hospital-Grade Sterilization", desc: "Every metal tool is autoclaved and sealed prior to your session." },
          { icon: "🌱", title: "100% Clean Formulations", desc: "Sulfate-free, paraben-free, and cruelty-free organic products." },
          { icon: "🚪", title: "Private Quiet Suites", desc: "Relax in individual climate-controlled private treatment rooms." },
          { icon: "☕", title: "Complimentary Herbal Bar", desc: "Enjoy organic chamomile or hibiscus infusions while you unwind." },
        ],
      };

    // =========================================================================
    // 2. CAFÉ & BISTRO
    // =========================================================================
    case "cafe":
      return {
        id: "cafe",
        label: "Café, Bakery & Roastery",
        badge: "☕ ROASTING FRESH DAILY • OPEN FROM " + (hours.split("-")[0] || "7:30 AM"),
        heroCta: "View Food & Drink Menu",
        heroCtaTarget: "cafe-menu",
        heroSecondaryCta: "Get Directions & Visit",
        heroSecondaryTarget: "directions",
        navLinks: [
          { label: "Menu", target: "cafe-menu" },
          { label: "Today's Roast", target: "roast-spotlight" },
          { label: "Find Us & Directions", target: "directions" },
          { label: "Reserve Table", target: "table-reservation", isCta: true },
        ],
        highlights: [
          { icon: "🥐", text: "Fresh Viennoiserie Bakes Daily" },
          { icon: "☕", text: "Single-Origin Specialty Roasts" },
          { icon: "📶", text: "Outdoor Patio & High-Speed Wi-Fi" },
        ],
        menuCategories: [
          {
            name: "Specialty Coffees & Brews",
            items: [
              { name: "Single-Origin Pour Over", desc: "Washed Ethiopian Yirgacheffe with notes of bergamot and jasmine honey.", price: "₹220", tag: "Roaster's Pick" },
              { name: "Oat Milk Velvet Flat White", desc: "Double shot espresso with silky micro-foam and artisanal oat milk.", price: "₹240", tag: "Vegan" },
              { name: "18-Hour Slow Cold Brew", desc: "Steeped cold with notes of cacao nibs and orange peel. Clean & crisp.", price: "₹210", tag: "Signature" },
            ]
          },
          {
            name: "Artisan Hearth Bakes",
            items: [
              { name: "Flaky French Butter Croissant", desc: "72-hour fermented pastry laminated with pure European cultured butter.", price: "₹180", tag: "Fresh 07:30 AM" },
              { name: "Valrhona Pain au Chocolat", desc: "Filled with two batons of 66% dark French chocolate.", price: "₹210", tag: "Bestseller" },
              { name: "Sourdough Toast & Avocado Smash", desc: "Country sourdough with spiced Hass avocado, hemp seeds, and extra virgin olive oil.", price: "₹310", tag: "All-Day Brunch" },
            ]
          },
          {
            name: "Kitchen & Savoury Bites",
            items: [
              { name: "Smoked Scamorza & Pesto Panini", desc: "House basil pesto, heirloom tomatoes, and melted smoked cheese on sourdough focaccia.", price: "₹340", tag: "Chef's Special" },
              { name: "Truffled Mushroom Brioche", desc: "Wild forest mushrooms sautéed in thyme butter on toasted brioche.", price: "₹360", tag: "Signature" },
            ]
          }
        ],
        roastSpotlight: {
          bean: "Monsooned Malabar & Ethiopian Sidama Blend",
          notes: "Dark Chocolate, Sweet Mandarin, Toasted Hazelnut",
          altitude: "1,450m - 1,800m MASL",
          roastDate: "Roasted In-House Every Tuesday & Friday",
        },
        directionsGuide: {
          address: loc,
          transit: "Just a 4-minute walk from Central Station. Ample designated customer parking in front.",
          dineInHours: hours,
          takeaway: "Order ahead for swift curb-side pickup.",
        }
      };

    // =========================================================================
    // 3. FASHION BOUTIQUE
    // =========================================================================
    case "boutique":
      return {
        id: "boutique",
        label: "Fashion Atelier & Curated Boutique",
        badge: "✨ NEW SEASON COLLECTION NOW IN ATELIER",
        heroCta: "Explore Lookbook",
        heroCtaTarget: "lookbook",
        heroSecondaryCta: "Book Private In-Store Fitting",
        heroSecondaryTarget: "fitting",
        navLinks: [
          { label: "Lookbook", target: "lookbook" },
          { label: "Atelier Craft", target: "craft" },
          { label: "Private Fitting", target: "fitting", isCta: true },
          { label: "Visit Boutique", target: "contact" },
        ],
        highlights: [
          { icon: "🧵", text: "Handwoven Natural Silks & Linens" },
          { icon: "✂️", text: "Complimentary Bespoke Tailoring" },
          { icon: "🛍️", text: "Private VIP Fitting Suites" },
        ],
        lookbookItems: (rawProducts.length >= 2 ? rawProducts : [
          "Hand-Embroidered Mulberry Silk Kurta",
          "Relaxed French Linen Summer Trench",
          "Block-Printed Organic Chanderi Saree",
          "Artisan Sterling Silver Statement Choker"
        ]).map((item, idx) => {
          const name = typeof item === "string" ? item : item.name || `Collection Piece ${idx + 1}`;
          const fabrics = ["100% Organic Handwoven Linen", "Pure Mulberry Silk", "Chanderi Cotton-Silk", "Solid 92.5 Sterling Silver"];
          const prices = ["₹3,890", "₹5,400", "₹6,900", "₹8,500"];
          const tags = ["New Season", "Bestseller", "Artisan Edit", "Limited Edition"];
          return {
            name,
            fabric: fabrics[idx % fabrics.length],
            price: prices[idx % prices.length],
            tag: tags[idx % tags.length],
            desc: "Designed for effortless elegance with meticulous hand-finished hems and timeless silhouette.",
          };
        }),
        craftPillars: [
          { title: "Artisan Heritage", desc: "Collaborating directly with 3rd-generation weaving clusters across the subcontinent." },
          { title: "Bespoke Alterations", desc: "Our in-house master tailors guarantee your garment falls with absolute perfection." },
          { title: "Low-Waste Philosophy", desc: "Crafted in limited runs with biodegradable dyes and zero synthetic polyester." },
        ]
      };

    // =========================================================================
    // 4. TUITION & COACHING
    // =========================================================================
    case "tuition":
      return {
        id: "tuition",
        label: "Academic Coaching & Tuition Academy",
        badge: "🎓 ADMISSIONS OPEN FOR 2026-27 • 98.4% BOARD DISTINCTION",
        heroCta: "Book Free Demo Class",
        heroCtaTarget: "demo-class",
        heroSecondaryCta: "View Subjects & Batch Timings",
        heroSecondaryTarget: "curriculum",
        navLinks: [
          { label: "Subjects & Batches", target: "curriculum" },
          { label: "Faculty", target: "faculty" },
          { label: "Results & Track Record", target: "results" },
          { label: "Free Demo Class", target: "demo-class", isCta: true },
        ],
        highlights: [
          { icon: "👥", text: "Strict Cap: Max 15 Students/Batch" },
          { icon: "📝", text: "Weekly Diagnostic Mock Exams" },
          { icon: "🎯", text: "Daily 1-on-1 Doubt Clearing Desk" },
        ],
        resultsCounters: [
          { number: "98.4%", label: "Average Board Exam Distinction" },
          { number: "500+", label: "Successful Students Mentored" },
          { number: "94.8", label: "Average Math & Science Score" },
          { number: "100%", label: "Syllabus Completed 60 Days Ahead" },
        ],
        curriculumBatches: [
          {
            grade: "Class 9 - 10 Foundation Batch",
            subjects: "Pure Mathematics, Physics, Chemistry, Biology",
            schedule: "Mon, Wed, Fri (4:30 PM - 6:30 PM)",
            features: "Conceptual fundamentals, NCERT deep-dive, and state board + CBSE test series.",
            badge: "Foundations",
          },
          {
            grade: "Class 11 - 12 Board & Entrance",
            subjects: "Advanced Physics, Chemistry & Higher Mathematics",
            schedule: "Tue, Thu, Sat (5:00 PM - 7:30 PM)",
            features: "Rigorous problem solving, numerical workshops, and past 15-year paper analysis.",
            badge: "Intensive",
          },
          {
            grade: "Target JEE / NEET Competitive Wing",
            subjects: "Comprehensive Competitive Problem Solving",
            schedule: "Sunday Weekend Marathons (9:00 AM - 1:00 PM)",
            features: "Speed-accuracy drills, error-tracking logbooks, and nationwide mock rankings.",
            badge: "Top Rankers",
          },
        ],
        faculty: [
          { name: "Prof. Rajesh Verma", role: "Head of Mathematics", cred: "M.Sc. Mathematics, 14+ Yrs Teaching", note: "Has coached over 40 state Olympiad medalists." },
          { name: "Dr. Sunita Rao", role: "Lead Physics Mentor", cred: "Ph.D. Applied Physics, Former Senior Lecturer", note: "Specializes in visualization of mechanics and electromagnetism." },
          { name: "Er. Amit Saxena", role: "Chemistry Faculty", cred: "B.Tech IIT Bombay, 9+ Yrs Coaching", note: "Author of simplified Organic Chemistry roadmaps." },
        ]
      };

    // =========================================================================
    // 5. LOCAL SERVICES & TRADES
    // =========================================================================
    case "local_service":
      return {
        id: "local_service",
        label: "Emergency Repairs & Local Trade Services",
        badge: "🚨 24/7 RAPID DISPATCH • 45-MIN ON-SITE GUARANTEE",
        heroCta: contact ? `Call Technician Now: ${contact}` : "Request Rapid Dispatch",
        heroCtaTarget: contact ? `tel:${contact.replace(/[^0-9+]/g, "")}` : "dispatch-form",
        heroSecondaryCta: "View Fixed Pricing Guide",
        heroSecondaryTarget: "pricing-guide",
        navLinks: [
          { label: "Repairs & Pricing", target: "pricing-guide" },
          { label: "Coverage Area", target: "coverage" },
          { label: "Guarantees", target: "guarantees" },
          { label: "🚨 Call Dispatch", target: "dispatch-form", isCta: true },
        ],
        highlights: [
          { icon: "🛡️", text: "90-Day Free Callback Warranty" },
          { icon: "⚡", text: "45-Minute Emergency Response" },
          { icon: "🏷️", text: "Transparent Upfront Fixed Quotes" },
        ],
        rateCard: (rawProducts.length >= 2 ? rawProducts : [
          "Emergency Pipe Burst & Leak Repair",
          "AC Deep Cleaning & Gas Refill",
          "Circuit Breaker & Short Circuit Fixing",
          "Complete Drain Unclogging & Jet Clean"
        ]).map((item, idx) => {
          const name = typeof item === "string" ? item : item.name || `Repair Job ${idx + 1}`;
          const prices = ["₹299", "₹499", "₹349", "₹599"];
          const durations = ["~30 Mins", "~45 Mins", "~40 Mins", "~60 Mins"];
          return {
            name,
            price: `Starting ${prices[idx % prices.length]}`,
            duration: durations[idx % durations.length],
            warranty: "90-Day Guarantee",
            desc: "Complete diagnostic examination, licensed technician labor, and safety testing.",
          };
        }),
        coverageGuide: {
          radius: "Covering all localities within 25 km of " + loc,
          responseTime: "Average technician arrival time: 38 minutes.",
          emergencyStatus: "Technicians currently on standby in your postal zone.",
        },
        guarantees: [
          { icon: "👨‍🔧", title: "Police-Verified Technicians", desc: "Every professional undergoes background checks and biometric verification." },
          { icon: "🔩", title: "Genuine OEM Spare Parts", desc: "We use only sealed, brand-certified parts with manufacturer warranty." },
          { icon: "🧾", title: "Zero Surprise Pricing", desc: "Full estimate approved by you before a single tool touches the work." },
          { icon: "🔄", title: "90-Day Warranty", desc: "If the issue recurs within 90 days, we fix it 100% free of charge." },
        ]
      };

    // =========================================================================
    // 6. CONSULTANTS & ADVISORY
    // =========================================================================
    case "consultant":
      return {
        id: "consultant",
        label: "Strategic Advisory & Professional Practice",
        badge: "⚖️ SWORN FIDUCIARY STANDARD • 15+ YRS MANDATE GOVERNANCE",
        heroCta: "Schedule 15-Min Discovery Call",
        heroCtaTarget: "discovery-call",
        heroSecondaryCta: "Explore Practice Areas",
        heroSecondaryTarget: "practice-areas",
        navLinks: [
          { label: "Practice Areas", target: "practice-areas" },
          { label: "Case Studies & Track Record", target: "case-studies" },
          { label: "Advisor Credentials", target: "credentials" },
          { label: "Schedule Call", target: "discovery-call", isCta: true },
        ],
        highlights: [
          { icon: "📜", text: "Strict Legal Fiduciary Duty" },
          { icon: "🚫", text: "Zero Hidden Commission Conflicts" },
          { icon: "💼", text: "Boardroom-Tested Advisory" },
        ],
        practiceAreas: (rawProducts.length >= 2 ? rawProducts : [
          "Private Wealth & Family Office Governance",
          "Corporate Tax Structuring & Cross-Border Compliance",
          "Fiduciary Risk Advisory & Succession Planning",
          "Business Valuation & Growth Mandates"
        ]).map((item, idx) => {
          const name = typeof item === "string" ? item : item.name || `Advisory Practice ${idx + 1}`;
          const deliverables = [
            "Asset allocation architecture, risk mitigation, and generational preservation.",
            "Structuring corporate entities to legally optimize tax liability and assure compliance.",
            "Family trusts, power of attorney mandates, and executive continuity frameworks.",
            "Cash flow modeling, capitalization strategy, and buy-side advisory."
          ];
          return {
            name,
            deliverables: deliverables[idx % deliverables.length],
            cadence: "Quarterly Fiduciary Review",
          };
        }),
        caseStudies: [
          { metric: "34% Tax Reduction", client: "Regional Manufacturing Firm", detail: "Restructured cross-border supply chain holding companies." },
          { metric: "$18M Mandate Governance", client: "Multi-Gen Family Office", detail: "Established irrevocable family trust with clear succession protocols." },
          { metric: "100% Audit Clearance", client: "Mid-Market Enterprise", detail: "Conducted statutory fiduciary risk and corporate compliance overhaul." },
        ],
        credentials: [
          { title: "Professional Designations", detail: "CPA, CFA Charterholder, Master of Laws (LL.M)" },
          { title: "Experience Record", detail: "15+ Years Direct Mandate Leadership across India & Global Markets" },
          { title: "The Fiduciary Standard", detail: "Legally bound to place your financial wellbeing strictly above our own." },
        ]
      };

    // Default Fallback
    default:
      return {
        id: "general",
        label: "Commercial Trade & Professional Services",
        badge: "★ VERIFIED BUSINESS PROFILE • " + loc,
        heroCta: "Get In Touch Today",
        heroCtaTarget: "contact",
        heroSecondaryCta: "View Services & Hours",
        heroSecondaryTarget: "services",
        navLinks: [
          { label: "About", target: "about" },
          { label: "Services", target: "services" },
          { label: "Trust Audit", target: "verified-manifest" },
          { label: "Contact", target: "contact", isCta: true },
        ],
        highlights: [
          { icon: "✓", text: "Direct Local Contact" },
          { icon: "★", text: "Verified Community Reputation" },
          { icon: "⏱️", text: "Reliable On-Schedule Service" },
        ]
      };
  }
}
