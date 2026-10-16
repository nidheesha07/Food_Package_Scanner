# 🌸 SHE Scan — Baddiez

> **Scan it. Understand it. Make it personal.**

**SHE Scan** is a personalized food-scanning and health-safety companion that helps users understand how packaged food products fit their individual health and dietary needs.

Instead of giving everyone the same generic nutrition score, SHE Scan evaluates products against the user's personalized profile — including conditions such as **PCOS/PCOD, diabetes, pregnancy, breastfeeding, lactose intolerance, and food allergies**.

### The core idea

> **Rules decide. AI explains.**

A deterministic rule engine evaluates the product and generates the verdict. AI is then used only to turn that result into a simple, human-readable explanation.

---

## ✨ Features

### 👤 Personalized Profile

Users can create a profile based on:

* PCOS / PCOD
* Pregnancy
* Breastfeeding
* Diabetes
* Lactose intolerance
* Food allergies
* Dietary preferences

These preferences are used to personalize every product analysis.

### 📷 Smart Product Scanning

Scan a product barcode directly through the web app.

SHE Scan retrieves available product information such as:

* Product name
* Brand
* Ingredients
* Nutritional values
* Allergen information

using the **Open Food Facts API**.

### 📝 Label OCR Fallback

Can't find the barcode?

Users can upload a photo of the product's nutrition or ingredient label. OCR extracts the available information and sends it through the same analysis pipeline.

### 🧠 Rule-Based Analysis

The product is evaluated against the user's profile using deterministic rules.

The engine considers factors such as:

* Sugar
* Carbohydrates
* Sodium
* Saturated fat
* Ingredients
* Dairy/lactose indicators
* Allergens
* Profile-specific nutritional concerns

The result is classified as:

🟢 **Suitable**
🟡 **Caution**
🔴 **Avoid**

### ⚠️ Allergen Override

Allergen detection has the highest priority.

If a product contains an allergen selected in the user's profile, SHE Scan displays a prominent allergen warning before the normal nutritional verdict.

### 🤖 AI-Powered Explanation

The AI does **not** decide whether a product is suitable.

Instead:

```text
Product Data
     ↓
Rule Engine
     ↓
Verdict + Triggered Rules
     ↓
AI Explanation
     ↓
Simple Human-Readable Result
```

This keeps the core decision-making deterministic while making the result easier to understand.

### 📊 Product Results

Each analysis can show:

* Overall verdict
* Nutrient amounts vs. relevant limits
* Ingredients of concern
* Allergen warnings
* Explanation of the result
* Potential concerns
* Healthier alternatives when appropriate

### 📚 Scan History

Previous product analyses can be saved and revisited, allowing users to keep track of what they've scanned.

---

# 🏗️ Architecture

SHE Scan follows a simple pipeline:

```text
┌──────────────────┐
│   User Profile   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Barcode / OCR    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Product Data    │
│ Open Food Facts  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Rule Engine     │
│                  │
│ Nutrients        │
│ Ingredients      │
│ Allergens        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│     Verdict      │
│ 🟢 🟡 🔴         │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ AI Explanation   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Result Screen  │
└──────────────────┘
```

---

# 🛠️ Tech Stack

| Layer             | Technology                       |
| ----------------- | -------------------------------- |
| Frontend          | React 19                         |
| Language          | TypeScript                       |
| Build Tool        | Vite                             |
| Styling           | CSS                              |
| Animation         | Framer Motion                    |
| Icons             | Lucide React                     |
| Authentication    | Supabase Auth                    |
| Database          | Supabase PostgreSQL              |
| Data Source       | Open Food Facts API              |
| Barcode Detection | Barcode Detector API             |
| Persistence       | Supabase + localStorage fallback |

---

# 📁 Project Structure

```text
baddiez/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   │   ├── rules/
│   │   ├── products/
│   │   └── ai/
│   └── data/
│
├── supabase/
│   └── migrations/
│       └── 001_create_schema.sql
│
├── public/
│
├── .env.example
├── package.json
├── vite.config.ts
└── README.md
```

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone <repository-url>
cd baddiez
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

SHE Scan uses Supabase for authentication and database persistence.

Copy the example environment file:

```bash
cp .env.example .env
```

Then add your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Important:** Never commit your `.env` file or expose private API keys in the frontend.

### Offline fallback

If Supabase is not configured or contains placeholder values, SHE Scan automatically falls back to **localStorage**.

This allows the application to remain usable for local development and demonstrations without requiring a configured backend.

---

# 🗄️ Database Setup

SHE Scan uses Supabase to persist:

* User profiles
* Scan history
* Cached product information

### Setup

1. Open your **Supabase Dashboard**.
2. Select your project.
3. Open **SQL Editor**.
4. Run:

```text
supabase/migrations/001_create_schema.sql
```

The migration creates:

```text
profiles
scans
products_cache
```

along with the required **Row Level Security (RLS)** policies.

---

# ▶️ Run Locally

Start the Vite development server:

```bash
npm run dev
```

Then open the local URL provided by Vite, typically:

```text
http://localhost:5173
```

---

# 🔄 User Flow

```text
Sign Up
   ↓
Personalized Onboarding
   ↓
Home Dashboard
   ↓
Scan Product
   ↓
Open Food Facts
   │
   ├── Product Found
   │
   └── Not Found
          ↓
       Label OCR
          ↓
    Product Normalization
          ↓
      Rule Engine
          ↓
     Allergen Check
          ↓
        Verdict
          ↓
     AI Explanation
          ↓
      Result Screen
          ↓
      Scan History
```

---

# 🔐 Data & Privacy

SHE Scan uses Supabase authentication and Row Level Security to help keep user-specific data separated.

The application is designed around the principle of collecting only the information required to personalize product analysis.

For local development without Supabase, profile and scan data can be stored locally using `localStorage`.

> SHE Scan is a prototype and does not provide medical diagnosis or medical advice.

---

# ⚠️ Important Safety Principle

SHE Scan separates **decision-making** from **language generation**.

The AI layer cannot:

* Override a verdict
* Invent nutritional values
* Invent ingredients
* Create new health rules
* Diagnose medical conditions
* Determine allergen presence independently

The deterministic rule engine remains the source of truth.

```text
             ┌───────────────┐
             │  Product Data  │
             └───────┬───────┘
                     ↓
             ┌───────────────┐
             │  Rule Engine  │
             └───────┬───────┘
                     ↓
              SOURCE OF TRUTH
                     │
              ┌──────┴──────┐
              ↓             ↓
          Verdict       Triggered Rules
                            │
                            ↓
                       AI Explanation
```

---

# 🎨 Design Philosophy

SHE Scan uses a **soft, editorial health-tech aesthetic** designed to feel calm, trustworthy, and approachable.

The interface uses:

* Warm whites
* Blush and rose accents
* Berry primary actions
* Clear green / amber / red verdict states
* Generous whitespace
* Accessible typography
* Subtle motion
* Responsive layouts

The design intentionally avoids:

* Neon colors
* Excessive gradients
* Glassmorphism
* Heavy shadows
* Overly clinical interfaces
* Excessive animations
* Generic dashboard aesthetics

---

# 📱 Responsive Experience

SHE Scan is designed for both mobile and desktop.

### Mobile

* Bottom navigation
* Thumb-friendly controls
* Large scan action
* Single-column result layout
* Mobile camera experience

### Desktop

* Sidebar navigation
* Expanded product analysis
* Multi-column layouts
* Larger result cards

---

# 🧪 Demo & Fallback Data

The application includes fallback/mock product data so the core experience can still be demonstrated when external services are unavailable.

Demo scenarios include:

* 🟢 Suitable product
* 🟡 High-sugar / caution product
* 🔴 Product with significant nutritional concerns
* ⚠️ Allergen conflict
* 🥛 Dairy-containing product

This ensures the main:

**Profile → Scan → Analyze → Explain → Result**

flow remains demoable without relying entirely on external APIs.

---

# 🔮 Future Scope

Potential future improvements include:

* More medically reviewed rule sets
* Expanded product databases
* Better multilingual OCR
* Personalized product recommendations
* Smarter ingredient synonym matching
* Nutritionist-reviewed recommendations
* Advanced scan history and trends
* Native mobile applications
* Wearable/device integrations

---

# 👩‍💻 Built By Baddiez

**SHE Scan** was created as a technology prototype focused on making packaged-food information more understandable and personalized.

> **Don't just scan the label. Understand what it means for you.**

---

## ⚠️ Disclaimer

SHE Scan is a prototype for informational and demonstration purposes. Its rules, thresholds, recommendations, and AI-generated explanations should not be treated as medical advice, diagnosis, or a substitute for consultation with a qualified healthcare professional.
