# 🚀 MakeSite — AI-Powered Website Generator

**MakeSite** is an AI-powered **Text-to-Website generation platform** that helps small businesses create a professional online presence without requiring web development knowledge.

Users can describe their business using **text or voice**, and MakeSite uses AI to extract the important business information and generate a customizable website preview.

> **Describe your business. Let AI build your website.**

---

## ✨ Features

### 🤖 AI-Powered Business Information Extraction
Describe your business in natural language and MakeSite automatically extracts structured information such as:

- Business Name
- Owner Name
- Business Category
- Location
- Opening Hours
- Contact Information
- Products / Services

### 🎤 Voice-to-Website
Users can describe their business using their voice instead of typing.

The browser's **Web Speech API** is used for speech recognition where supported.

### 💬 Intelligent Clarification
If important business information is missing, MakeSite identifies the missing fields and asks the user for additional information.

For example:

> "My shop is Sharma Boutique in Rajkot and we sell traditional women's clothing."

If the contact number or business hours are missing, MakeSite can ask the user to provide them.

### 🎨 Website Templates

MakeSite generates a website preview using the extracted business information.

The project supports multiple website styles/templates, allowing businesses to select a design that suits them.

### 👀 Live Website Preview

Users can preview the generated website before downloading it.

The preview dynamically uses the business information extracted by the AI.

### 📥 Website Download

The generated website can be downloaded so that the user can use or further customize it.

---

# 🏗️ System Architecture

```text
                   ┌─────────────────────┐
                   │       User          │
                   │ Text / Voice Input  │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   React Frontend    │
                   │     + Vite          │
                   └──────────┬──────────┘
                              │
                         HTTP Request
                              │
                              ▼
                   ┌─────────────────────┐
                   │   FastAPI Backend   │
                   │                     │
                   │ /extract            │
                   │ /update-business    │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │      Groq API       │
                   │  AI Model / LLM     │
                   └──────────┬──────────┘
                              │
                         Structured Data
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Website Generator  │
                   │     Templates       │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ Website Preview &   │
                   │      Download       │
                   └─────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Web Speech API

## Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

## AI

- Groq API
- LLM-based natural language information extraction

## Development Tools

- Git
- GitHub
- VS Code
- npm
- Python Virtual Environment

---

# 📁 Project Structure

```text
MakeSite/
│
├── Backend/
│   ├── main.py
│   ├── extraction.py
│   ├── schemas.py
│   ├── requirements.txt
│   ├── .env
│   └── .gitignore
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
└── README.md
```

> The exact folder/file structure may change as the project evolves.

---

# ⚙️ How It Works

### Step 1 — Business Description

The user provides a description of their business.

Example:

```text
I own Sharma Boutique in Rajkot.
We sell traditional women's clothing and accessories.
We are open from 10 AM to 8 PM.
Customers can contact us at 9876543210.
```

### Step 2 — AI Extraction

The frontend sends the description to the FastAPI backend.

```http
POST /extract
```

The backend sends the description to the AI model and converts the natural-language input into structured business information.

Example output:

```json
{
  "business_name": "Sharma Boutique",
  "owner_name": "Sharma",
  "category": "Clothing",
  "location": "Rajkot",
  "hours": "10 AM - 8 PM",
  "contact": "9876543210",
  "products": [
    "Traditional Women's Clothing",
    "Accessories"
  ]
}
```

### Step 3 — Missing Information

If required information is missing, MakeSite identifies it and asks the user for clarification.

The additional information is sent through:

```http
POST /update-business
```

### Step 4 — Website Generation

The structured business information is passed to the website template system.

The selected template dynamically displays:

- Business name
- Business description
- Products/services
- Location
- Contact information
- Business hours

### Step 5 — Preview & Download

The user can preview the generated website and download the final website files.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have the following installed:

- **Python 3.10+**
- **Node.js 18+**
- **npm**
- **Git**

Check your installations:

```bash
python --version
node --version
npm --version
git --version
```

---

# 🔧 Backend Setup

Navigate to the backend directory:

```bash
cd Backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `Backend` directory.

```env
GROQ_API_KEY=your_groq_api_key
```

**Never commit your `.env` file or API keys to GitHub.**

Make sure `.env` is included in `.gitignore`.

---

## ▶️ Run the Backend

Start the FastAPI development server:

```bash
uvicorn main:app --reload
```

The backend will normally run at:

```text
http://127.0.0.1:8000
```

FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

# 💻 Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local URL, usually:

```text
http://localhost:5173
```

Open the URL in your browser.

---

# 🎤 Browser Voice Recognition

MakeSite uses the browser's speech recognition capabilities for voice input.

Browser support can vary.

Recommended browsers:

- Google Chrome
- Microsoft Edge

The voice feature may not work consistently in browsers that do not support the required Web Speech API functionality.

---

# 🔐 Security

MakeSite uses environment variables for sensitive credentials.

The following files should **never** be committed:

```text
.env
venv/
__pycache__/
node_modules/
```

Example `.gitignore`:

```gitignore
# Python
venv/
__pycache__/
*.pyc

# Environment
.env

# Node
node_modules/
dist/

# IDE
.vscode/
```

---

# 🧪 API Endpoints

## `POST /extract`

Extracts structured business information from a natural-language description.

### Request

```json
{
  "text": "I own Sharma Boutique in Rajkot..."
}
```

### Response

```json
{
  "business_name": "Sharma Boutique",
  "owner_name": "Sharma",
  "category": "Clothing",
  "location": "Rajkot",
  "hours": "10 AM - 8 PM",
  "contact": "9876543210",
  "products": [
    "Traditional Clothing"
  ]
}
```

---

## `POST /update-business`

Updates previously extracted business information using additional user clarification.

This allows MakeSite to handle incomplete information without forcing the user to start the process again.

---

# 🎯 Target Users

MakeSite is primarily designed for:

- Small business owners
- Local shops
- Home businesses
- Freelancers
- Entrepreneurs
- Users without web development experience

Examples include:

- Clothing stores
- Restaurants
- Cafés
- Grocery stores
- Salons
- Boutiques
- Electronics shops
- Local service providers

---

# 💡 Problem Statement

Many small businesses do not have a website because creating one traditionally requires:

- Web development knowledge
- Design skills
- Hosting knowledge
- Time
- Technical resources

MakeSite aims to reduce this barrier by allowing users to describe their business naturally and letting AI handle the initial information processing and website generation.

---

# 🌟 Project Objective

The main objective of MakeSite is to create a simple **AI-assisted website generation platform** where a user can go from:

```text
Business Idea
      ↓
Natural Language / Voice
      ↓
AI Information Extraction
      ↓
Missing Information Clarification
      ↓
Website Template
      ↓
Live Preview
      ↓
Downloadable Website
```

without manually writing HTML, CSS, or JavaScript.

---

# 🔮 Future Enhancements

Planned or possible improvements include:

- [ ] More website templates
- [ ] AI-generated website content
- [ ] AI-generated images
- [ ] Custom color and font selection
- [ ] Custom domain integration
- [ ] One-click website deployment
- [ ] User authentication
- [ ] Saved projects
- [ ] Database integration
- [ ] Mobile-first templates
- [ ] Multilingual voice input
- [ ] Improved AI validation
- [ ] SEO optimization
- [ ] Accessibility improvements
- [ ] Production cloud deployment

---

# 📊 Current Development Status

MakeSite is currently under active development.

The core workflow has been implemented:

```text
✅ User Input
        ↓
✅ AI Business Information Extraction
        ↓
✅ Missing Information Detection
        ↓
✅ Clarification / Business Update
        ↓
✅ Website Template Generation
        ↓
✅ Website Preview
        ↓
✅ Website Download
```

Additional UI improvements, templates, testing, deployment, and production-level features are being developed.

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### 1. Fork the repository

```bash
git fork
```

### 2. Clone the repository

```bash
git clone <repository-url>
```

### 3. Create a branch

```bash
git checkout -b feature/your-feature
```

### 4. Make your changes

### 5. Commit your changes

```bash
git add .
git commit -m "Add: your feature"
```

### 6. Push your branch

```bash
git push origin feature/your-feature
```

### 7. Open a Pull Request

---

# 👨‍💻 Developer

**Harshvardhansinh Jadeja**

MCA Student | Software Development | AI & Web Technologies

### Technologies & Interests

- Python
- React
- FastAPI
- AI/ML
- Web Development
- Cloud Technologies

---

# 📜 License

This project is currently intended for **educational and academic purposes**.

A formal open-source license can be added as the project moves toward public distribution.

---

# ⭐ Support

If you find MakeSite interesting, consider giving the repository a ⭐ on GitHub.

**MakeSite — From a simple description to a website. 🚀**
