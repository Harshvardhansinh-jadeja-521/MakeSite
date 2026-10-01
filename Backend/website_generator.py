import html
from typing import Dict, Any, List


AVAILABLE_TEMPLATES = [
    {
        "id": "modern-dark",
        "name": "Neon Cyber / Dark Luxe",
        "category": "Technology & Modern",
        "description": "Deep obsidian glassmorphism with glowing neon cyan & indigo gradients, 3D cards, and high-tech elegance.",
        "badge": "Popular",
        "accent": "#6366f1",
        "accent_secondary": "#06b6d4",
        "bg_type": "dark",
        "palette": ["#090b10", "#121622", "#6366f1", "#06b6d4", "#f0f4f8"],
        "icon": "⚡",
    },
    {
        "id": "minimal-clean",
        "name": "Minimalist Studio",
        "category": "Editorial & Design",
        "description": "Crisp editorial layout with Swiss typography, monochrome contrast, generous whitespace, and subtle sage borders.",
        "badge": "Clean",
        "accent": "#18181b",
        "accent_secondary": "#10b981",
        "bg_type": "light",
        "palette": ["#fcfcfd", "#f4f4f5", "#18181b", "#71717a", "#10b981"],
        "icon": "◻️",
    },
    {
        "id": "vibrant-gradient",
        "name": "Aurora Vibrant",
        "category": "Creative & SaaS",
        "description": "Energetic fluid mesh gradients, glowing pill badges, smooth card animations, and vivid modern styling.",
        "badge": "Trendy",
        "accent": "#ec4899",
        "accent_secondary": "#8b5cf6",
        "bg_type": "dark",
        "palette": ["#0b0d17", "#17152b", "#ec4899", "#8b5cf6", "#f9fafb"],
        "icon": "✨",
    },
    {
        "id": "corporate-pro",
        "name": "Enterprise Executive",
        "category": "Corporate & Finance",
        "description": "Authoritative deep navy and champagne gold palette, structured trust badges, and boardroom-ready credibility.",
        "badge": "Business",
        "accent": "#0f2b48",
        "accent_secondary": "#d97706",
        "bg_type": "light",
        "palette": ["#f8fafc", "#ffffff", "#0f2b48", "#1e3a5f", "#d97706"],
        "icon": "💼",
    },
    {
        "id": "warm-artisan",
        "name": "Sunset Bistro / Warm Artisan",
        "category": "Culinary & Boutique",
        "description": "Earthy terracotta, honey amber, and warm cream with elegant serif headlines, perfect for cafes, restaurants, and craft stores.",
        "badge": "Artisan",
        "accent": "#c2410c",
        "accent_secondary": "#d97706",
        "bg_type": "warm",
        "palette": ["#fdfbf7", "#fef3c7", "#c2410c", "#78350f", "#292524"],
        "icon": "☕",
    },
    {
        "id": "emerald-wellness",
        "name": "Emerald Oasis / Health & Spa",
        "category": "Wellness & Medical",
        "description": "Soothing eucalyptus, deep emerald, and soft mint tones with zen rounded curves, ideal for clinics, yoga, therapy, and spas.",
        "badge": "Wellness",
        "accent": "#059669",
        "accent_secondary": "#10b981",
        "bg_type": "calm",
        "palette": ["#f0fdf4", "#ffffff", "#065f46", "#059669", "#34d399"],
        "icon": "🌿",
    },
    {
        "id": "tech-bold",
        "name": "Cyber High-Impact / Dev Hub",
        "category": "Agency & Engineering",
        "description": "High-contrast matrix black with acid lime & purple accents, terminal typography, and ultra-dynamic geometric blocks.",
        "badge": "High Energy",
        "accent": "#84cc16",
        "accent_secondary": "#a855f7",
        "bg_type": "dark",
        "palette": ["#050505", "#111111", "#84cc16", "#a855f7", "#e5e7eb"],
        "icon": "🔥",
    },
]


def escape(val: Any) -> str:
    """Safe HTML entity escape."""
    if val is None:
        return ""
    return html.escape(str(val))


def sanitize_cta(cta_text: Any, default: str = "Contact Us") -> str:
    """Strictly enforces static informational CTAs. Forbids shop/buy/order/cart/e-commerce words."""
    if not cta_text or not isinstance(cta_text, str) or not cta_text.strip():
        return escape(default)
    forbidden = [
        "shop now", "buy now", "order now", "add to cart", "cart",
        "purchase", "checkout", "shop online", "order online", "order & visit",
        "order today", "buy online", "shop"
    ]
    lower = cta_text.lower()
    for f in forbidden:
        if f in lower:
            return escape(default)
    return escape(cta_text.strip())


def generate_services_cards(services: List[Dict[str, str]], template_id: str) -> str:
    """Render services list into template-specific HTML cards."""
    cards = []
    for idx, s in enumerate(services):
        title = escape(s.get("name", f"Service {idx + 1}"))
        desc = escape(s.get("description", ""))
        num_str = f"0{idx + 1}" if idx < 9 else f"{idx + 1}"
        cards.append(f"""
        <div class="service-card">
          <div class="service-card-top">
            <span class="service-num">{num_str}</span>
            <div class="service-indicator"></div>
          </div>
          <h3 class="service-title">{title}</h3>
          <p class="service-desc">{desc}</p>
        </div>""")
    return "\n".join(cards)


def generate_features_cards(features: List[Dict[str, str]]) -> str:
    """Render key features or USPs."""
    if not features:
        return ""
    items = []
    for idx, f in enumerate(features):
        title = escape(f.get("title", ""))
        desc = escape(f.get("description", ""))
        items.append(f"""
        <div class="feature-item">
          <div class="feature-icon">&#10003;</div>
          <div class="feature-content">
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        </div>""")
    return "\n".join(items)


def generate_faqs_cards(faqs: List[Dict[str, str]]) -> str:
    """Render FAQ accordion / list."""
    if not faqs:
        return ""
    items = []
    for f in faqs:
        q = escape(f.get("question", ""))
        a = escape(f.get("answer", ""))
        items.append(f"""
        <div class="faq-item">
          <h4 class="faq-q">{q}</h4>
          <p class="faq-a">{a}</p>
        </div>""")
    return "\n".join(items)


SHARED_SMOOTH_SCROLL_CSS = """
    html {
      scroll-behavior: smooth;
    }
    .highlight-pulse {
      animation: staticPulse 1.8s ease-in-out !important;
    }
    @keyframes staticPulse {
      0% { transform: scale(1); outline: 3px solid transparent; }
      25% { transform: scale(1.02); outline: 3px solid #3b82f6; box-shadow: 0 0 35px rgba(59, 130, 246, 0.6); }
      60% { transform: scale(1.01); outline: 2px solid #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
      100% { transform: scale(1); outline: 3px solid transparent; }
    }
"""


def get_universal_script() -> str:
    return """
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // 1. In-page smooth scroll & visual pulse for all static anchor buttons
      document.querySelectorAll('a[href^="#"], button[data-target]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          var href = this.getAttribute('href') || ('#' + this.getAttribute('data-target'));
          if (href && href.startsWith('#')) {
            var targetId = href.substring(1);
            if (!targetId || targetId === '') targetId = 'contact';
            var targetEl = document.getElementById(targetId);
            if (targetEl) {
              e.preventDefault();
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              targetEl.classList.remove('highlight-pulse');
              void targetEl.offsetWidth; // Trigger reflow for re-animation
              targetEl.classList.add('highlight-pulse');
              setTimeout(function() {
                targetEl.classList.remove('highlight-pulse');
              }, 2000);
            }
          }
        });
      });

      // 2. Interactive Contact Copy Button
      document.querySelectorAll('.btn-copy-contact').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var contactVal = this.getAttribute('data-contact') || '';
          if (contactVal && navigator.clipboard) {
            navigator.clipboard.writeText(contactVal).then(function() {
              showToast('✓ Contact Details Copied to Clipboard: ' + contactVal);
            }).catch(function() {
              showToast('📞 Contact: ' + contactVal);
            });
          } else {
            showToast('📞 Contact: ' + (contactVal || 'Available on request'));
          }
        });
      });

      function showToast(text) {
        var existing = document.getElementById('static-makesite-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.id = 'static-makesite-toast';
        toast.innerText = text;
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:#ffffff;padding:12px 28px;border-radius:99px;font-size:14px;font-weight:700;box-shadow:0 8px 30px rgba(0,0,0,0.6);z-index:99999;font-family:sans-serif;pointer-events:none;transition:opacity 0.3s ease;';
        document.body.appendChild(toast);
        setTimeout(function() {
          toast.style.opacity = '0';
          setTimeout(function() { toast.remove(); }, 350);
        }, 3000);
      }
    });
  </script>
"""


# ==============================================================================
# 1. MODERN DARK (Neon Cyber / Dark Luxe)
# ==============================================================================
def build_modern_dark(b_data: Dict[str, Any], content: Dict[str, Any]) -> str:
    b_name = escape(b_data.get("business_name") or "Your Brand")
    category = escape(b_data.get("category") or "Services")
    location = escape(b_data.get("location") or "Regional Hub")
    hours = escape(b_data.get("hours") or "Standard Hours")
    contact = escape(b_data.get("contact") or "")
    hero_title = escape(content.get("hero_title") or f"Next-Gen {category}")
    hero_desc = escape(content.get("hero_description") or "")
    about = escape(content.get("about") or "")
    cta = sanitize_cta(content.get("cta"), default="Connect With Us")
    services_html = generate_services_cards(content.get("services", []), "modern-dark")
    features_html = generate_features_cards(content.get("features", []))
    faqs_html = generate_faqs_cards(content.get("faqs", []))

    contact_link = "#contact"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b_name} | {hero_title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #090b10;
      --card-bg: rgba(18, 22, 34, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f0f4f8;
      --text-muted: #94a3b8;
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.3);
      --neon-cyan: #06b6d4;
      --gradient: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
    }}
    .bg-glow {{
      position: fixed;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, transparent 70%);
      top: -100px;
      right: -100px;
      pointer-events: none;
      filter: blur(80px);
      z-index: 0;
    }}
    .bg-glow-2 {{
      position: fixed;
      width: 450px;
      height: 450px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%);
      bottom: -100px;
      left: -100px;
      pointer-events: none;
      filter: blur(80px);
      z-index: 0;
    }}
    .container {{
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 0;
      border-bottom: 1px solid var(--card-border);
    }}
    .brand-logo {{
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-decoration: none;
    }}
    .header-badge {{
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
    }}
    .hero {{
      padding: 90px 0 60px;
      text-align: center;
    }}
    .pill-tag {{
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      border-radius: 30px;
      font-size: 0.85rem;
      color: var(--neon-cyan);
      margin-bottom: 24px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 600;
    }}
    .hero h1 {{
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2.4rem, 5vw, 4.2rem);
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 24px;
      background: linear-gradient(180deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .hero p {{
      font-size: 1.2rem;
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto 36px;
    }}
    .btn-cta {{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--gradient);
      color: #fff;
      padding: 16px 36px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.05rem;
      box-shadow: 0 10px 25px var(--accent-glow);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    .btn-cta:hover {{
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 15px 35px rgba(99, 102, 241, 0.45);
    }}
    .info-ribbon {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      padding: 24px 32px;
      border-radius: 16px;
      margin-top: 48px;
      text-align: left;
    }}
    .info-item h4 {{
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }}
    .info-item p {{
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }}
    .section-title {{
      text-align: center;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2.2rem;
      margin: 90px 0 16px;
      font-weight: 700;
    }}
    .section-subtitle {{
      text-align: center;
      color: var(--text-muted);
      max-width: 500px;
      margin: 0 auto 48px;
    }}
    .services-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }}
    .service-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 32px;
      backdrop-filter: blur(12px);
      transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }}
    .service-card:hover {{
      transform: translateY(-6px);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }}
    .service-card-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }}
    .service-num {{
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      color: var(--neon-cyan);
      font-size: 1.1rem;
    }}
    .service-indicator {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 12px var(--accent);
    }}
    .service-title {{
      font-size: 1.25rem;
      margin-bottom: 12px;
      font-weight: 700;
    }}
    .service-desc {{
      color: var(--text-muted);
      font-size: 0.95rem;
    }}
    .about-box {{
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 48px;
      margin: 80px 0;
    }}
    .about-box h2 {{
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.8rem;
      margin-bottom: 16px;
    }}
    .about-box p {{
      font-size: 1.1rem;
      color: #cbd5e1;
      line-height: 1.7;
    }}
    .features-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }}
    .feature-item {{
      display: flex;
      gap: 16px;
      align-items: flex-start;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 24px;
      border-radius: 16px;
    }}
    .feature-icon {{
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }}
    .feature-content h4 {{
      font-size: 1.05rem;
      margin-bottom: 6px;
    }}
    .feature-content p {{
      font-size: 0.9rem;
      color: var(--text-muted);
    }}
    .contact-card {{
      background: radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, rgba(18, 22, 34, 0.9) 70%);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 24px;
      padding: 56px 40px;
      text-align: center;
      margin: 80px 0;
    }}
    .contact-card h2 {{
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2.2rem;
      margin-bottom: 16px;
    }}
    .contact-card p {{
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 540px;
      margin: 0 auto 32px;
    }}
    footer {{
      border-top: 1px solid var(--card-border);
      padding: 48px 0;
      margin-top: 80px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }}
    {SHARED_SMOOTH_SCROLL_CSS}
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-glow-2"></div>
  <div class="container">
    <header>
      <a href="#" class="brand-logo">{b_name}</a>
      <div class="header-badge">{category}</div>
    </header>

    <section class="hero">
      <div class="pill-tag">&#9670; Verified Business &#9670;</div>
      <h1>{hero_title}</h1>
      <p>{hero_desc}</p>
      <a href="{contact_link}" class="btn-cta">{cta} &rarr;</a>

      <div class="info-ribbon">
        <div class="info-item">
          <h4>Location</h4>
          <p>{location}</p>
        </div>
        <div class="info-item">
          <h4>Hours</h4>
          <p>{hours}</p>
        </div>
        <div class="info-item">
          <h4>Contact</h4>
          <p>{contact or "Available upon request"}</p>
        </div>
      </div>
    </section>

    <div class="about-box">
      <h2>About {b_name}</h2>
      <p>{about}</p>
    </div>

    <section id="services">
      <h2 class="section-title">Our Solutions & Services</h2>
      <p class="section-subtitle">Tailored specifically to deliver quality, convenience, and peace of mind.</p>
      <div class="services-grid">
        {services_html}
      </div>
    </section>

    {"<section><h2 class='section-title'>Why Choose Us</h2><div class='features-grid'>" + features_html + "</div></section>" if features_html else ""}

    <div class="contact-card" id="contact">
      <h2>Visit & Contact Us</h2>
      <p>Reach out to {b_name} today. We are ready to assist you in {location}.</p>
      <div class="info-ribbon" style="margin: 24px 0; text-align: left;">
        <div class="info-item"><h4>Location</h4><p>{location}</p></div>
        <div class="info-item"><h4>Hours</h4><p>{hours}</p></div>
        <div class="info-item"><h4>Direct Contact</h4><p>{contact or "Available upon request"}</p></div>
      </div>
      <button type="button" class="btn-cta btn-copy-contact" data-contact="{contact or location}" style="border:none; cursor:pointer;">📋 Copy Contact Info</button>
    </div>

    <footer>
      <div class="brand-logo" style="margin-bottom: 12px; display:inline-block;">{b_name}</div>
      <p>&copy; 2026 {b_name}. All rights reserved.</p>
      <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 6px;">Powered by MakeSite AI Engine</p>
    </footer>
  </div>
  {get_universal_script()}
</body>
</html>"""


# ==============================================================================
# 2. MINIMAL CLEAN (Minimalist Studio / Swiss Editorial)
# ==============================================================================
def build_minimal_clean(b_data: Dict[str, Any], content: Dict[str, Any]) -> str:
    b_name = escape(b_data.get("business_name") or "Studio")
    category = escape(b_data.get("category") or "Consultancy")
    location = escape(b_data.get("location") or "Metropolitan Hub")
    hours = escape(b_data.get("hours") or "By Appointment")
    contact = escape(b_data.get("contact") or "")
    hero_title = escape(content.get("hero_title") or f"Pure, Intentional {category}")
    hero_desc = escape(content.get("hero_description") or "")
    about = escape(content.get("about") or "")
    cta = sanitize_cta(content.get("cta"), default="Inquire Now")
    services_html = generate_services_cards(content.get("services", []), "minimal-clean")
    features_html = generate_features_cards(content.get("features", []))

    contact_link = "#contact"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b_name} — {category}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #fafafa;
      --card-bg: #ffffff;
      --border: #e4e4e7;
      --text: #18181b;
      --text-muted: #71717a;
      --accent: #18181b;
      --emerald: #059669;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
    }}
    .container {{
      max-width: 1040px;
      margin: 0 auto;
      padding: 0 32px;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32px 0;
      border-bottom: 1px solid var(--border);
    }}
    .brand {{
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      color: var(--text);
      text-decoration: none;
    }}
    .header-cat {{
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }}
    .hero {{
      padding: 100px 0 70px;
    }}
    .eyebrow {{
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--emerald);
      font-weight: 600;
      margin-bottom: 20px;
      display: inline-block;
    }}
    .hero h1 {{
      font-size: clamp(2.4rem, 5vw, 4rem);
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: -0.04em;
      margin-bottom: 28px;
      max-width: 850px;
    }}
    .hero p {{
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 640px;
      margin-bottom: 40px;
      font-weight: 300;
    }}
    .hero-btn {{
      display: inline-block;
      background: var(--accent);
      color: #fff;
      padding: 14px 32px;
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      border-radius: 4px;
      transition: opacity 0.2s ease;
    }}
    .hero-btn:hover {{ opacity: 0.85; }}
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 32px;
      padding: 40px 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      margin: 60px 0;
    }}
    .meta-col h5 {{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 8px;
    }}
    .meta-col p {{
      font-size: 1rem;
      font-weight: 600;
    }}
    .editorial-about {{
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 48px;
      margin: 90px 0;
    }}
    @media (max-width: 768px) {{
      .editorial-about {{ grid-template-columns: 1fr; gap: 24px; }}
    }}
    .editorial-about h2 {{
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }}
    .editorial-about p {{
      font-size: 1.15rem;
      color: #3f3f46;
      line-height: 1.8;
    }}
    .services-section {{
      margin: 90px 0;
    }}
    .sec-head {{
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 40px;
    }}
    .services-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }}
    .service-card {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 32px;
      border-radius: 6px;
      transition: border-color 0.2s;
    }}
    .service-card:hover {{
      border-color: #a1a1aa;
    }}
    .service-card-top {{
      margin-bottom: 16px;
    }}
    .service-num {{
      font-size: 0.85rem;
      color: var(--text-muted);
      font-family: monospace;
    }}
    .service-title {{
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }}
    .service-desc {{
      color: var(--text-muted);
      font-size: 0.95rem;
    }}
    footer {{
      border-top: 1px solid var(--border);
      padding: 48px 0;
      margin-top: 90px;
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 0.85rem;
    }}
    {SHARED_SMOOTH_SCROLL_CSS}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="#" class="brand">{b_name}</a>
      <span class="header-cat">{category}</span>
    </header>

    <section class="hero">
      <span class="eyebrow">&#9679; Established Profile</span>
      <h1>{hero_title}</h1>
      <p>{hero_desc}</p>
      <a href="{contact_link}" class="hero-btn">{cta} &rarr;</a>
    </section>

    <div class="meta-grid">
      <div class="meta-col">
        <h5>Location</h5>
        <p>{location}</p>
      </div>
      <div class="meta-col">
        <h5>Hours</h5>
        <p>{hours}</p>
      </div>
      <div class="meta-col">
        <h5>Contact</h5>
        <p>{contact or "Available upon request"}</p>
      </div>
    </div>

    <div class="editorial-about">
      <h2>Our Philosophy</h2>
      <p>{about}</p>
    </div>

    <section class="services-section">
      <h2 class="sec-head">Selected Offerings</h2>
      <div class="services-grid">
        {services_html}
      </div>
    </section>

    <section class="services-section" id="contact" style="margin-top: 60px;">
      <h2 class="sec-head">Direct Contact & Inquiries</h2>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Reach our team directly or visit us during standard hours.</p>
      <div class="meta-grid" style="margin: 20px 0;">
        <div class="meta-col">
          <h5>Location</h5>
          <p>{location}</p>
        </div>
        <div class="meta-col">
          <h5>Hours</h5>
          <p>{hours}</p>
        </div>
        <div class="meta-col">
          <h5>Contact</h5>
          <p>{contact or "Available upon request"}</p>
        </div>
      </div>
      <button type="button" class="hero-btn btn-copy-contact" data-contact="{contact or location}" style="border:none; cursor:pointer; font-family:inherit;">📋 Copy Contact Details</button>
    </section>

    <footer>
      <span>&copy; 2026 {b_name}</span>
      <span>MakeSite Studio Edition</span>
    </footer>
  </div>
  {get_universal_script()}
</body>
</html>"""


# ==============================================================================
# 3. VIBRANT GRADIENT (Aurora Vibrant)
# ==============================================================================
def build_vibrant_gradient(b_data: Dict[str, Any], content: Dict[str, Any]) -> str:
    b_name = escape(b_data.get("business_name") or "Creative Co")
    category = escape(b_data.get("category") or "Creative Agency")
    location = escape(b_data.get("location") or "Everywhere")
    hours = escape(b_data.get("hours") or "Open Always")
    contact = escape(b_data.get("contact") or "")
    hero_title = escape(content.get("hero_title") or f"Supercharge Your {category}")
    hero_desc = escape(content.get("hero_description") or "")
    about = escape(content.get("about") or "")
    cta = sanitize_cta(content.get("cta"), default="Connect With Us")
    services_html = generate_services_cards(content.get("services", []), "vibrant-gradient")
    features_html = generate_features_cards(content.get("features", []))

    contact_link = "#contact"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b_name} — {hero_title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #0b0d17;
      --card-bg: rgba(23, 21, 43, 0.7);
      --border: rgba(236, 72, 153, 0.2);
      --text: #f9fafb;
      --text-muted: #a1a1aa;
      --pink: #ec4899;
      --purple: #8b5cf6;
      --grad: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%);
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Outfit', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
    }}
    .aurora-orb {{
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.18) 0%, rgba(139, 92, 246, 0.12) 50%, transparent 70%);
      top: -150px;
      left: 50%;
      transform: translateX(-50%);
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
    }}
    .container {{
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 0;
    }}
    .logo {{
      font-size: 1.6rem;
      font-weight: 800;
      background: var(--grad);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-decoration: none;
    }}
    .cat-pill {{
      background: rgba(236, 72, 153, 0.15);
      border: 1px solid var(--pink);
      color: #f472b6;
      padding: 6px 16px;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 600;
    }}
    .hero {{
      text-align: center;
      padding: 90px 0 60px;
    }}
    .sparkle-tag {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 0.9rem;
      margin-bottom: 24px;
    }}
    .hero h1 {{
      font-size: clamp(2.6rem, 5.5vw, 4.5rem);
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 24px;
      background: linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .hero p {{
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 660px;
      margin: 0 auto 36px;
    }}
    .btn-aurora {{
      display: inline-block;
      background: var(--grad);
      color: #fff;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 1.1rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(236, 72, 153, 0.35);
      transition: transform 0.25s, box-shadow 0.25s;
    }}
    .btn-aurora:hover {{
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 15px 40px rgba(236, 72, 153, 0.5);
    }}
    .info-bar {{
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      margin-top: 50px;
      backdrop-filter: blur(16px);
    }}
    .info-bar-item {{
      padding: 8px 16px;
      text-align: center;
    }}
    .info-bar-item h5 {{
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--pink);
      letter-spacing: 0.05em;
    }}
    .info-bar-item p {{
      font-size: 1.05rem;
      font-weight: 600;
    }}
    .about-card {{
      background: linear-gradient(135deg, rgba(23, 21, 43, 0.8) 0%, rgba(35, 25, 60, 0.8) 100%);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 48px;
      margin: 80px 0;
    }}
    .about-card h2 {{
      font-size: 2rem;
      margin-bottom: 16px;
    }}
    .about-card p {{
      font-size: 1.15rem;
      color: #cbd5e1;
      line-height: 1.75;
    }}
    .services-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin: 40px 0 80px;
    }}
    .service-card {{
      background: var(--card-bg);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 32px;
      backdrop-filter: blur(12px);
      transition: all 0.3s ease;
    }}
    .service-card:hover {{
      transform: translateY(-6px);
      border-color: var(--pink);
      box-shadow: 0 15px 35px rgba(236, 72, 153, 0.2);
    }}
    .service-card-top {{
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }}
    .service-num {{
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--pink);
    }}
    .service-title {{
      font-size: 1.3rem;
      margin-bottom: 10px;
      font-weight: 700;
    }}
    .service-desc {{
      color: var(--text-muted);
      font-size: 0.95rem;
    }}
    footer {{
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 40px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }}
    {SHARED_SMOOTH_SCROLL_CSS}
  </style>
</head>
<body>
  <div class="aurora-orb"></div>
  <div class="container">
    <header>
      <a href="#" class="logo">{b_name}</a>
      <span class="cat-pill">{category}</span>
    </header>

    <section class="hero">
      <div class="sparkle-tag">✨ Transformative Experience</div>
      <h1>{hero_title}</h1>
      <p>{hero_desc}</p>
      <a href="{contact_link}" class="btn-aurora">{cta}</a>

      <div class="info-bar">
        <div class="info-bar-item">
          <h5>Location</h5>
          <p>{location}</p>
        </div>
        <div class="info-bar-item">
          <h5>Hours</h5>
          <p>{hours}</p>
        </div>
        <div class="info-bar-item">
          <h5>Direct Contact</h5>
          <p>{contact or "Inquire Online"}</p>
        </div>
      </div>
    </section>

    <div class="about-card">
      <h2>The Story Behind {b_name}</h2>
      <p>{about}</p>
    </div>

    <section>
      <h2 style="font-size: 2.2rem; text-align: center; font-weight: 800;">Featured Services</h2>
      <div class="services-grid">
        {services_html}
      </div>
    </section>

    <div class="about-card" id="contact" style="border-color:var(--pink); margin-top:60px;">
      <span class="sparkle-tag">✨ Direct Connection</span>
      <h2>Visit & Connect with {b_name}</h2>
      <p style="color:var(--text-muted); margin-bottom:20px;">We are happily serving customers across {location}. Check our full schedule and details below:</p>
      <div class="info-bar" style="margin: 20px 0;">
        <div class="info-bar-item">
          <h5>Location</h5>
          <p>{location}</p>
        </div>
        <div class="info-bar-item">
          <h5>Hours</h5>
          <p>{hours}</p>
        </div>
        <div class="info-bar-item">
          <h5>Direct Contact</h5>
          <p>{contact or "Inquire Online"}</p>
        </div>
      </div>
      <button type="button" class="btn-aurora btn-copy-contact" data-contact="{contact or location}" style="border:none; cursor:pointer; font-family:inherit;">📋 Copy Contact Info</button>
    </div>

    <footer>
      <p>&copy; 2026 {b_name}. Crafted with MakeSite AI.</p>
    </footer>
  </div>
  {get_universal_script()}
</body>
</html>"""


# ==============================================================================
# 4. CORPORATE PRO (Enterprise Executive / Authority Navy)
# ==============================================================================
def build_corporate_pro(b_data: Dict[str, Any], content: Dict[str, Any]) -> str:
    b_name = escape(b_data.get("business_name") or "Enterprise Solutions")
    category = escape(b_data.get("category") or "Financial & Legal Services")
    location = escape(b_data.get("location") or "Corporate Headquarters")
    hours = escape(b_data.get("hours") or "Monday - Friday: 9am - 6pm")
    contact = escape(b_data.get("contact") or "")
    hero_title = escape(content.get("hero_title") or f"Institutional Leadership in {category}")
    hero_desc = escape(content.get("hero_description") or "")
    about = escape(content.get("about") or "")
    cta = sanitize_cta(content.get("cta"), default="Schedule Consultation")
    services_html = generate_services_cards(content.get("services", []), "corporate-pro")
    features_html = generate_features_cards(content.get("features", []))

    contact_link = "#contact"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b_name} — {category}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {{
      --navy: #0f2b48;
      --navy-dark: #0a1c30;
      --gold: #d97706;
      --gold-light: #fef3c7;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #1e293b;
      --text-muted: #64748b;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }}
    .top-bar {{
      background: var(--navy-dark);
      color: #94a3b8;
      font-size: 0.8rem;
      padding: 10px 0;
    }}
    .container {{
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 24px;
    }}
    .top-bar-inner {{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    header {{
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      padding: 20px 0;
    }}
    .header-inner {{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .brand {{
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--navy);
      text-decoration: none;
      letter-spacing: -0.02em;
    }}
    .trust-badge {{
      background: var(--gold-light);
      color: var(--gold);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
    }}
    .hero {{
      background: linear-gradient(135deg, var(--navy) 0%, #1e3a5f 100%);
      color: #ffffff;
      padding: 90px 0;
    }}
    .hero-content {{
      max-width: 800px;
    }}
    .hero-tag {{
      display: inline-block;
      color: #fcd34d;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 18px;
    }}
    .hero h1 {{
      font-size: clamp(2.4rem, 5vw, 3.8rem);
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 24px;
      letter-spacing: -0.03em;
    }}
    .hero p {{
      font-size: 1.2rem;
      color: #cbd5e1;
      margin-bottom: 36px;
    }}
    .hero-cta {{
      display: inline-block;
      background: var(--gold);
      color: #ffffff;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4);
      transition: background 0.2s;
    }}
    .hero-cta:hover {{
      background: #b45309;
    }}
    .stats-bar {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-top: -40px;
      position: relative;
      z-index: 10;
    }}
    .stat-card {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px 28px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }}
    .stat-card h5 {{
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }}
    .stat-card p {{
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--navy);
    }}
    .about-sec {{
      padding: 90px 0 60px;
    }}
    .about-sec h2 {{
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--navy);
      margin-bottom: 20px;
    }}
    .about-sec p {{
      font-size: 1.15rem;
      color: var(--text-muted);
      line-height: 1.8;
    }}
    .services-sec {{
      background: #ffffff;
      padding: 80px 0;
      border-top: 1px solid var(--border);
    }}
    .sec-title {{
      font-size: 2rem;
      font-weight: 800;
      color: var(--navy);
      margin-bottom: 12px;
    }}
    .sec-desc {{
      color: var(--text-muted);
      margin-bottom: 48px;
    }}
    .services-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 28px;
    }}
    .service-card {{
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      transition: all 0.2s;
    }}
    .service-card:hover {{
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
      border-color: #cbd5e1;
    }}
    .service-num {{
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--gold);
    }}
    .service-title {{
      font-size: 1.25rem;
      color: var(--navy);
      margin: 12px 0 8px;
      font-weight: 700;
    }}
    .service-desc {{
      color: var(--text-muted);
      font-size: 0.95rem;
    }}
    footer {{
      background: var(--navy-dark);
      color: #94a3b8;
      padding: 48px 0;
      text-align: center;
      font-size: 0.9rem;
    }}
    {SHARED_SMOOTH_SCROLL_CSS}
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="container top-bar-inner">
      <span>Serving {location} with Proven Reliability</span>
      <span>{hours}</span>
    </div>
  </div>

  <header>
    <div class="container header-inner">
      <a href="#" class="brand">{b_name}</a>
      <span class="trust-badge">{category}</span>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <span class="hero-tag">Executive Trust & Authority</span>
        <h1>{hero_title}</h1>
        <p>{hero_desc}</p>
        <a href="{contact_link}" class="hero-cta">{cta} &rarr;</a>
      </div>
    </div>
  </section>

  <div class="container">
    <div class="stats-bar">
      <div class="stat-card">
        <h5>Official Location</h5>
        <p>{location}</p>
      </div>
      <div class="stat-card">
        <h5>Operating Schedule</h5>
        <p>{hours}</p>
      </div>
      <div class="stat-card">
        <h5>Direct Inquiries</h5>
        <p>{contact or "Schedule Above"}</p>
      </div>
    </div>
  </div>

  <section class="about-sec">
    <div class="container">
      <h2>About {b_name}</h2>
      <p>{about}</p>
    </div>
  </section>

  <section class="services-sec">
    <div class="container">
      <h2 class="sec-title">Core Competencies & Services</h2>
      <p class="sec-desc">Comprehensive client-centered solutions designed for enduring impact.</p>
      <div class="services-grid">
        {services_html}
      </div>
    </div>
  </section>

  <section class="services-sec" id="contact" style="padding: 20px 0;">
    <div class="container">
      <div class="stats-bar" style="background:#ffffff; border:1px solid #cbd5e1; border-top:4px solid var(--navy); border-radius:12px; padding:36px; margin:20px 0;">
        <h3 style="font-family:'Space Grotesk',sans-serif; font-size:1.6rem; color:var(--navy); margin-bottom:12px;">Direct Corporate Contact</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">Engage with our leadership team for consultations and institutional services across {location}.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:24px;">
          <div><h5 style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase;">OFFICIAL LOCATION</h5><p style="font-weight:700; font-size:1.05rem;">{location}</p></div>
          <div><h5 style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase;">OPERATING SCHEDULE</h5><p style="font-weight:700; font-size:1.05rem;">{hours}</p></div>
          <div><h5 style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase;">DIRECT COMMS</h5><p style="font-weight:700; font-size:1.05rem;">{contact or "Available upon request"}</p></div>
        </div>
        <button type="button" class="hero-cta btn-copy-contact" data-contact="{contact or location}" style="border:none; cursor:pointer; font-family:inherit;">📋 Copy Direct Contact Info</button>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; 2026 {b_name}. All corporate rights reserved.</p>
    </div>
  </footer>
  {get_universal_script()}
</body>
</html>"""


# ==============================================================================
# 5. WARM ARTISAN (Sunset Bistro / Warm Artisan Cafe & Boutique)
# ==============================================================================
def build_warm_artisan(b_data: Dict[str, Any], content: Dict[str, Any]) -> str:
    b_name = escape(b_data.get("business_name") or "The Artisan House")
    category = escape(b_data.get("category") or "Culinary & Crafts")
    location = escape(b_data.get("location") or "Historic District")
    hours = escape(b_data.get("hours") or "Daily 8am - 9pm")
    contact = escape(b_data.get("contact") or "")
    hero_title = escape(content.get("hero_title") or f"Handcrafted With Passion — {b_name}")
    hero_desc = escape(content.get("hero_description") or "")
    about = escape(content.get("about") or "")
    cta = sanitize_cta(content.get("cta"), default="Visit & Connect With Us")
    services_html = generate_services_cards(content.get("services", []), "warm-artisan")

    contact_link = "#contact"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b_name} — {category}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --cream: #fdfbf7;
      --card-bg: #ffffff;
      --terracotta: #c2410c;
      --amber: #d97706;
      --brown: #451a03;
      --border: #f2e8dc;
      --text: #292524;
      --text-muted: #78716c;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--cream);
      color: var(--text);
      line-height: 1.7;
    }}
    .container {{
      max-width: 1080px;
      margin: 0 auto;
      padding: 0 24px;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32px 0;
      border-bottom: 1px solid var(--border);
    }}
    .brand {{
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--brown);
      text-decoration: none;
    }}
    .header-badge {{
      background: #fef3c7;
      color: var(--terracotta);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 30px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .hero {{
      text-align: center;
      padding: 90px 0 60px;
    }}
    .artisan-tag {{
      display: inline-block;
      font-family: 'Playfair Display', serif;
      font-style: italic;
      color: var(--terracotta);
      font-size: 1.1rem;
      margin-bottom: 16px;
    }}
    .hero h1 {{
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.5rem, 5.5vw, 4.2rem);
      font-weight: 900;
      color: var(--brown);
      line-height: 1.15;
      margin-bottom: 24px;
    }}
    .hero p {{
      font-size: 1.2rem;
      color: var(--text-muted);
      max-width: 660px;
      margin: 0 auto 36px;
    }}
    .btn-artisan {{
      display: inline-block;
      background: var(--terracotta);
      color: #fff;
      padding: 16px 40px;
      border-radius: 40px;
      font-size: 1.05rem;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 10px 25px rgba(194, 65, 12, 0.25);
      transition: background 0.2s, transform 0.2s;
    }}
    .btn-artisan:hover {{
      background: #9a3412;
      transform: translateY(-2px);
    }}
    .warm-ribbon {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
      margin: 50px 0;
      box-shadow: 0 10px 30px rgba(69, 26, 3, 0.04);
      text-align: left;
    }}
    .warm-ribbon h5 {{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--terracotta);
      margin-bottom: 6px;
    }}
    .warm-ribbon p {{
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--brown);
    }}
    .story-section {{
      background: #fbf5ee;
      border-radius: 24px;
      padding: 60px 48px;
      margin: 70px 0;
    }}
    .story-section h2 {{
      font-family: 'Playfair Display', serif;
      font-size: 2.2rem;
      color: var(--brown);
      margin-bottom: 18px;
    }}
    .story-section p {{
      font-size: 1.15rem;
      color: #44403c;
      line-height: 1.8;
    }}
    .services-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin: 40px 0 80px;
    }}
    .service-card {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 32px;
      box-shadow: 0 6px 20px rgba(69, 26, 3, 0.03);
      transition: transform 0.2s;
    }}
    .service-card:hover {{
      transform: translateY(-4px);
    }}
    .service-num {{
      font-family: 'Playfair Display', serif;
      font-size: 1.2rem;
      font-style: italic;
      color: var(--terracotta);
    }}
    .service-title {{
      font-family: 'Playfair Display', serif;
      font-size: 1.35rem;
      color: var(--brown);
      margin: 12px 0 8px;
    }}
    .service-desc {{
      color: var(--text-muted);
      font-size: 0.95rem;
    }}
    footer {{
      border-top: 1px solid var(--border);
      padding: 48px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }}
    {SHARED_SMOOTH_SCROLL_CSS}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="#" class="brand">{b_name}</a>
      <span class="header-badge">{category}</span>
    </header>

    <section class="hero">
      <span class="artisan-tag">~ Authentically Prepared & Curated ~</span>
      <h1>{hero_title}</h1>
      <p>{hero_desc}</p>
      <a href="{contact_link}" class="btn-artisan">{cta}</a>

      <div class="warm-ribbon">
        <div>
          <h5>Our Location</h5>
          <p>{location}</p>
        </div>
        <div>
          <h5>Serving Hours</h5>
          <p>{hours}</p>
        </div>
        <div>
          <h5>Direct Contact</h5>
          <p>{contact or "Warmly Welcome"}</p>
        </div>
      </div>
    </section>

    <div class="story-section">
      <h2>The Craft & Story of {b_name}</h2>
      <p>{about}</p>
    </div>

    <section>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; text-align: center; color: var(--brown);">Our Signature Offerings</h2>
      <div class="services-grid">
        {services_html}
      </div>
    </section>

    <section id="contact" style="margin: 80px 0; background: #fef3c7; border: 2px solid #d97706; border-radius: 20px; padding: 40px; text-align: center;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #78350f; margin-bottom: 12px;">Visit Our House</h2>
      <p style="color: #92400e; font-size: 1.1rem; margin-bottom: 24px;">We are delighted to welcome guests across {location}. Check our schedule below:</p>
      <div class="warm-ribbon" style="margin: 20px 0;">
        <div><h5>Our Location</h5><p>{location}</p></div>
        <div><h5>Serving Hours</h5><p>{hours}</p></div>
        <div><h5>Direct Contact</h5><p>{contact or "Warmly Welcome"}</p></div>
      </div>
      <button type="button" class="btn-artisan btn-copy-contact" data-contact="{contact or location}" style="border:none; cursor:pointer; font-family:inherit;">📋 Copy Contact Info</button>
    </section>

    <footer>
      <p>&copy; 2026 {b_name}. Proudly welcoming guests across {location}.</p>
    </footer>
  </div>
  {get_universal_script()}
</body>
</html>"""


# ==============================================================================
# 6. EMERALD WELLNESS (Health, Spa & Medical Sanctuary)
# ==============================================================================
def build_emerald_wellness(b_data: Dict[str, Any], content: Dict[str, Any]) -> str:
    b_name = escape(b_data.get("business_name") or "Oasis Wellness")
    category = escape(b_data.get("category") or "Health & Wellness")
    location = escape(b_data.get("location") or "Wellness Center")
    hours = escape(b_data.get("hours") or "Mon - Sat: 8am - 7pm")
    contact = escape(b_data.get("contact") or "")
    hero_title = escape(content.get("hero_title") or f"Holistic Well-being with {b_name}")
    hero_desc = escape(content.get("hero_description") or "")
    about = escape(content.get("about") or "")
    cta = sanitize_cta(content.get("cta"), default="Inquire & Visit Us")
    services_html = generate_services_cards(content.get("services", []), "emerald-wellness")

    contact_link = "#contact"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b_name} — {category}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #f2fbf5;
      --card-bg: #ffffff;
      --emerald-dark: #064e3b;
      --emerald: #059669;
      --emerald-light: #d1fae5;
      --border: #dcfce7;
      --text: #1e293b;
      --text-muted: #64748b;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
    }}
    .container {{
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 0;
    }}
    .brand {{
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--emerald-dark);
      text-decoration: none;
      letter-spacing: -0.02em;
    }}
    .pill-cat {{
      background: var(--emerald-light);
      color: var(--emerald-dark);
      padding: 6px 16px;
      border-radius: 99px;
      font-size: 0.85rem;
      font-weight: 700;
    }}
    .hero {{
      text-align: center;
      padding: 80px 0 50px;
    }}
    .zen-tag {{
      display: inline-block;
      color: var(--emerald);
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 20px;
    }}
    .hero h1 {{
      font-size: clamp(2.4rem, 5vw, 4rem);
      font-weight: 800;
      color: var(--emerald-dark);
      line-height: 1.15;
      margin-bottom: 24px;
      letter-spacing: -0.03em;
    }}
    .hero p {{
      font-size: 1.2rem;
      color: var(--text-muted);
      max-width: 660px;
      margin: 0 auto 36px;
    }}
    .btn-emerald {{
      display: inline-block;
      background: var(--emerald);
      color: #ffffff;
      padding: 16px 36px;
      border-radius: 30px;
      font-size: 1.05rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 8px 24px rgba(5, 150, 105, 0.3);
      transition: all 0.2s;
    }}
    .btn-emerald:hover {{
      background: var(--emerald-dark);
      transform: translateY(-2px);
    }}
    .wellness-ribbon {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 30px;
      margin: 50px 0;
      box-shadow: 0 10px 25px rgba(6, 78, 59, 0.04);
      text-align: left;
    }}
    .wellness-ribbon h5 {{
      font-size: 0.8rem;
      color: var(--emerald);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }}
    .wellness-ribbon p {{
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--emerald-dark);
    }}
    .about-sec {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 48px;
      margin: 70px 0;
    }}
    .about-sec h2 {{
      font-size: 2rem;
      color: var(--emerald-dark);
      margin-bottom: 16px;
      font-weight: 800;
    }}
    .about-sec p {{
      font-size: 1.15rem;
      color: #475569;
      line-height: 1.8;
    }}
    .services-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin: 40px 0 80px;
    }}
    .service-card {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 4px 16px rgba(6, 78, 59, 0.03);
      transition: all 0.2s;
    }}
    .service-card:hover {{
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(6, 78, 59, 0.08);
      border-color: #a7f3d0;
    }}
    .service-num {{
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--emerald);
    }}
    .service-title {{
      font-size: 1.25rem;
      color: var(--emerald-dark);
      margin: 12px 0 8px;
      font-weight: 700;
    }}
    .service-desc {{
      color: var(--text-muted);
      font-size: 0.95rem;
    }}
    footer {{
      border-top: 1px solid var(--border);
      padding: 48px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }}
    {SHARED_SMOOTH_SCROLL_CSS}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="#" class="brand">🌿 {b_name}</a>
      <span class="pill-cat">{category}</span>
    </header>

    <section class="hero">
      <span class="zen-tag">Natural Balance & Care</span>
      <h1>{hero_title}</h1>
      <p>{hero_desc}</p>
      <a href="{contact_link}" class="btn-emerald">{cta}</a>

      <div class="wellness-ribbon">
        <div>
          <h5>Sanctuary Location</h5>
          <p>{location}</p>
        </div>
        <div>
          <h5>Appointment Hours</h5>
          <p>{hours}</p>
        </div>
        <div>
          <h5>Direct Contact</h5>
          <p>{contact or "Available Daily"}</p>
        </div>
      </div>
    </section>

    <div class="about-sec">
      <h2>Restoring Vitality at {b_name}</h2>
      <p>{about}</p>
    </div>

    <section>
      <h2 style="font-size: 2.2rem; text-align: center; color: var(--emerald-dark); font-weight: 800;">Our Specialized Therapies & Offerings</h2>
      <div class="services-grid">
        {services_html}
      </div>
    </section>

    <section id="contact" style="margin: 70px 0; background: #ffffff; border: 2px solid var(--emerald); border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(5, 150, 105, 0.08);">
      <span class="zen-tag">SANCTUARY INQUIRIES</span>
      <h2 style="font-size: 2rem; color: var(--emerald-dark); margin-bottom: 16px;">Connect with {b_name}</h2>
      <p style="color: var(--text-muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto 24px;">Our practitioners welcome you in {location}. Inquire or visit during our open hours:</p>
      <div class="wellness-ribbon" style="margin: 20px 0;">
        <div><h5>Sanctuary Location</h5><p>{location}</p></div>
        <div><h5>Appointment Hours</h5><p>{hours}</p></div>
        <div><h5>Direct Contact</h5><p>{contact or "Available Daily"}</p></div>
      </div>
      <button type="button" class="btn-emerald btn-copy-contact" data-contact="{contact or location}" style="border:none; cursor:pointer; font-family:inherit;">📋 Copy Sanctuary Contact Details</button>
    </section>

    <footer>
      <p>&copy; 2026 {b_name}. Dedicated to wellness in {location}.</p>
    </footer>
  </div>
  {get_universal_script()}
</body>
</html>"""


# ==============================================================================
# 7. TECH BOLD (Cyber High-Impact / Terminal Dev Engine)
# ==============================================================================
def build_tech_bold(b_data: Dict[str, Any], content: Dict[str, Any]) -> str:
    b_name = escape(b_data.get("business_name") or "CyberOps")
    category = escape(b_data.get("category") or "Engineering & Tech")
    location = escape(b_data.get("location") or "Global Node")
    hours = escape(b_data.get("hours") or "24/7/365 Available")
    contact = escape(b_data.get("contact") or "")
    hero_title = escape(content.get("hero_title") or f"Ultra-Performance {category}")
    hero_desc = escape(content.get("hero_description") or "")
    about = escape(content.get("about") or "")
    cta = sanitize_cta(content.get("cta"), default="Contact Our Team")
    services_html = generate_services_cards(content.get("services", []), "tech-bold")

    contact_link = "#contact"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{b_name} // {category}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #050505;
      --card-bg: #0d0d0d;
      --lime: #84cc16;
      --lime-glow: rgba(132, 204, 22, 0.25);
      --purple: #a855f7;
      --border: #222222;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Space Grotesk', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }}
    .container {{
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 24px;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 0;
      border-bottom: 1px solid var(--border);
    }}
    .terminal-logo {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--lime);
      text-decoration: none;
    }}
    .terminal-logo::before {{
      content: ">_ ";
      color: var(--purple);
    }}
    .tag-badge {{
      font-family: 'JetBrains Mono', monospace;
      background: rgba(132, 204, 22, 0.1);
      border: 1px solid var(--lime);
      color: var(--lime);
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.8rem;
    }}
    .hero {{
      padding: 100px 0 60px;
    }}
    .sys-status {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--lime);
      margin-bottom: 20px;
      display: inline-block;
    }}
    .hero h1 {{
      font-size: clamp(2.5rem, 5.5vw, 4.4rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.04em;
      margin-bottom: 24px;
      text-transform: uppercase;
    }}
    .hero p {{
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 680px;
      margin-bottom: 36px;
    }}
    .btn-lime {{
      display: inline-block;
      background: var(--lime);
      color: #000000;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 6px;
      text-decoration: none;
      box-shadow: 0 0 25px var(--lime-glow);
      transition: all 0.2s;
    }}
    .btn-lime:hover {{
      transform: translateY(-2px);
      box-shadow: 0 0 35px rgba(132, 204, 22, 0.45);
    }}
    .matrix-ribbon {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 50px;
    }}
    .matrix-box {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-left: 3px solid var(--lime);
      padding: 20px;
    }}
    .matrix-box h5 {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 6px;
    }}
    .matrix-box p {{
      font-size: 1rem;
      font-weight: 700;
    }}
    .about-sec {{
      border: 1px solid var(--border);
      background: var(--card-bg);
      border-radius: 12px;
      padding: 48px;
      margin: 80px 0;
    }}
    .about-sec h2 {{
      font-size: 2rem;
      margin-bottom: 16px;
      color: var(--lime);
    }}
    .about-sec p {{
      font-size: 1.15rem;
      color: #d1d5db;
      line-height: 1.75;
    }}
    .services-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 40px 0 80px;
    }}
    .service-card {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 32px;
      border-radius: 8px;
      transition: border-color 0.2s;
    }}
    .service-card:hover {{
      border-color: var(--lime);
    }}
    .service-num {{
      font-family: 'JetBrains Mono', monospace;
      color: var(--purple);
      font-size: 1.1rem;
    }}
    .service-title {{
      font-size: 1.25rem;
      margin: 12px 0 8px;
      font-weight: 700;
    }}
    .service-desc {{
      color: var(--text-muted);
      font-size: 0.95rem;
    }}
    footer {{
      border-top: 1px solid var(--border);
      padding: 40px 0;
      text-align: center;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
    }}
    {SHARED_SMOOTH_SCROLL_CSS}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="#" class="terminal-logo">{b_name}</a>
      <span class="tag-badge">SYS: {category}</span>
    </header>

    <section class="hero">
      <div class="sys-status">● SYSTEM ALLOCATION ONLINE</div>
      <h1>{hero_title}</h1>
      <p>{hero_desc}</p>
      <a href="{contact_link}" class="btn-lime">{cta} //EXECUTE</a>

      <div class="matrix-ribbon">
        <div class="matrix-box">
          <h5>[NODE LOCATION]</h5>
          <p>{location}</p>
        </div>
        <div class="matrix-box">
          <h5>[UPTIME SCHEDULE]</h5>
          <p>{hours}</p>
        </div>
        <div class="matrix-box">
          <h5>[DIRECT COMMS]</h5>
          <p>{contact or "CHANNEL OPEN"}</p>
        </div>
      </div>
    </section>

    <div class="about-sec">
      <h2>Architecture & Mission</h2>
      <p>{about}</p>
    </div>

    <section>
      <h2 style="font-size: 2rem; margin-bottom: 24px; text-transform: uppercase;">Deployed Capabilities</h2>
      <div class="services-grid">
        {services_html}
      </div>
    </section>

    <section id="contact" style="margin: 80px 0; background: #0d0d0d; border: 2px solid var(--lime); padding: 36px; border-radius: 8px;">
      <div class="sys-status" style="margin-bottom: 12px;">● DIRECT COMMS PORT OPEN</div>
      <h2 style="font-size: 1.8rem; color: var(--lime); margin-bottom: 20px; font-family: 'JetBrains Mono', monospace;">[NODE DIRECT CONTACT]</h2>
      <div class="matrix-ribbon" style="margin: 20px 0;">
        <div class="matrix-box"><h5>[LOCATION]</h5><p>{location}</p></div>
        <div class="matrix-box"><h5>[SCHEDULE]</h5><p>{hours}</p></div>
        <div class="matrix-box"><h5>[COMMS]</h5><p>{contact or "CHANNEL OPEN"}</p></div>
      </div>
      <button type="button" class="btn-lime btn-copy-contact" data-contact="{contact or location}" style="border:none; cursor:pointer; margin-top:16px; font-family:inherit;">// COPY COMMS DATA</button>
    </section>

    <footer>
      <p>&copy; 2026 {b_name} // MAKE_SITE ENGINE BUILD</p>
    </footer>
  </div>
  {get_universal_script()}
</body>
</html>"""


# ==============================================================================
# ROUTER & EXPORT
# ==============================================================================
TEMPLATE_BUILDERS = {
    "modern-dark": build_modern_dark,
    "minimal-clean": build_minimal_clean,
    "vibrant-gradient": build_vibrant_gradient,
    "corporate-pro": build_corporate_pro,
    "warm-artisan": build_warm_artisan,
    "emerald-wellness": build_emerald_wellness,
    "tech-bold": build_tech_bold,
}


def generate_standalone_website_html(
    business_data: Dict[str, Any],
    content: Dict[str, Any],
    template_id: str = "modern-dark",
) -> str:
    """Entrypoint to generate full standalone website HTML for any template."""
    builder = TEMPLATE_BUILDERS.get(template_id, build_modern_dark)
    return builder(business_data, content)


def get_available_templates() -> List[Dict[str, Any]]:
    """Returns available website templates."""
    return AVAILABLE_TEMPLATES
