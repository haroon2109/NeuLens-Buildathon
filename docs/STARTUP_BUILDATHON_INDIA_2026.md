# NeuLens — Startup Buildathon India 2026 Submission Dossier

> **Transforming Early Brain Health & Cognitive Monitoring in India with Google AI & Google Cloud**
> **Supervised and Architected with Google Antigravity**

---

## Executive Summary

- **Product Name**: NeuLens
- **Tagline**: The 5-minute multimodal cognitive screening platform for India.
- **Target Audience**: 149M+ aging Indians, primary health clinics, geriatric hospitals, and family caregivers.
- **Languages Supported**: English (India), தமிழ் (Tamil), हिन्दी (Hindi).
- **Core Technology**: Google MediaPipe (on-device edge vision), Google Gemini 2.5 Flash (clinical reasoning & copilot), Google Antigravity (agentic architecture), and Google Cloud.

---

## 01. Founder Profile: Who You Are and Why You Built This

### The Founder
- **Lead Developer & Founder**: Mohamed Haroon (`haroon2109`) & NeuLens Team.
- **Background**: AI engineer and clinical accessibility technologist dedicated to building frugal, scalable healthcare solutions for India.

### The Spark & The Problem
In India today, **over 8.8 million older adults suffer from dementia**, projected to surge beyond 14 million by 2030 (LASI-DAD National Study, Ministry of Health and Family Welfare). Yet:
- **Over 90% of cognitive decline remains undiagnosed** until Stage 3 (severe Alzheimer's / irreversible dementia), when care is purely palliative.
- **Cultural Stigma & Normalization**: Memory loss is dismissed as *"வயதானால் மறதி சகஜம்"* (Tamil) or *"बुढ़ापे में भूलना तो आम बात है"* (Hindi). Families only seek help when wandering or behavioral crises occur.
- **Crippling Diagnostic Scarcity**: India has fewer than **1 neurologist per 1,000,000 citizens** in non-metro regions. Clinical neuropsychological batteries (MMSE, MoCA, ADAS-Cog) take 45–90 minutes, cost ₹5,000–₹25,000 ($60–$300) with PET/MRI scans, and suffer from **severe urban/English bias** that misclassifies individuals with lower formal education as cognitively impaired.
- **Our Mission**: Make proactive brain health screening as accessible, routine, and stigma-free as checking blood pressure at a neighborhood pharmacy.

---

## 02. Product Potential: A Clear Problem, and a Product That Solves It Well

### The NeuLens Breakthrough
NeuLens turns any everyday smartphone, tablet, or laptop into a **5-minute multimodal screening battery** requiring no proprietary hardware or clinical technician.

### 5 Multimodal Digital Biomarkers
1. **Ocular Micro-Movements (Oculomotor Biomarker)**:
   - Uses **Google MediaPipe** for real-time sub-pixel iris tracking and 3D eye gaze vector analysis.
   - Measures fixation hold stability, micro-saccadic latencies, and gaze jitter (established early biomarkers of neurodegeneration).
2. **Visual Memory & Association (Cortex Match)**:
   - **Culturally Adapted Indian Stimuli**: Abstract clinical shapes are replaced with universally recognized Indian everyday objects: **Diya (🪔), Mango (🥭), Peacock (🦚), Lotus (🪷)**.
   - Assesses episodic retrieval without cultural or educational bias.
3. **Acoustic Vocal Biomarker (Vocal Echo)**:
   - Captures speech rate, articulation tempo, hesitation jitter, and pause-to-speech ratio in **Tamil, Hindi, and Indian English**.
   - Everyday conversational sentences replace clinical tongue-twisters.
4. **Facial Dynamics & Affective Symmetry (Mimic Sync)**:
   - **Google MediaPipe 478 3D facial mesh** tracks bilateral facial movement symmetry, emotional reactivity, and micro-expressions.
5. **Executive Function & Trail-Making (Path Mapper)**:
   - Digital trail-making test with personalized pacing and error-recovery guidance.

### High Accessibility & Education-Aware Scoring
- **Low-Literacy & Illiteracy Inclusive**: High-contrast pictograms and complete **spoken vernacular audio assistance** (via Web Speech API in `ta-IN` / `hi-IN` / `en-IN`) enable users to listen rather than read.
- **Education Calibration**: Years of formal schooling (`educationYears`) are explicitly recorded and normed, preventing false-positive referrals for non-literate seniors.
- **Longitudinal Personal Baseline Anchor**: Rather than comparing an Indian grandmother against a Western population average, NeuLens establishes her **personal longitudinal baseline** and tracks statistically reliable changes ($\Delta \le -5.0$ RCI).
- **Clinician-in-the-Loop Safety**: NeuLens never makes an automated "dementia" diagnosis. It prepares structured, evidence-backed dossiers for doctor sign-off.

---

## 03. Market Viability: A Real Market and a Way to Reach It

### Market Opportunity
- **Total Addressable Market (TAM)**: 149 Million Indian seniors (60+), growing to 347 Million by 2050 (UNFPA India Ageing Report). Indian preventive diagnostics market is valued at **$10B+** (22% CAGR).
- **Serviceable Addressable Market (SAM)**: ₹8,500 Crore ($1.02B) market for geriatric health monitoring, memory clinic admissions, and private elder care.
- **Serviceable Obtainable Market (SOM)**: 1.5 Million annual screenings across Tier 1 & Tier 2 healthcare networks within 24 months.

### Go-To-Market (GTM) Strategy
1. **Hospital & Memory Clinic Partnerships**:
   - Outpatient neurology departments (e.g., NIMHANS, Apollo, Fortis, Manipal) deploy NeuLens for rapid triage before expensive MRI/PET evaluations.
2. **Ayushman Bharat & Primary Health Centres (PHCs)**:
   - Low-compute footprint allows ASHA and ANM community health workers to administer 5-minute screenings on low-cost tablets during door-to-door senior health check-ups.
3. **Organized Eldercare & Senior Living**:
   - Tie-ups with residential communities (Antara, Columbia Pacific, Emoha, Samarth) for routine biannual longitudinal brain-health monitoring.
4. **Direct-to-Family Subscription**:
   - B2C companion app at ₹499/year allowing adult children in metros to track the brain health of elderly parents living in hometowns.

### Business Model
- **B2B SaaS**: ₹15,000/month per hospital/clinic for unlimited screening access, clinician portal, and EHR integration.
- **Pay-Per-Screening API**: ₹50 per completed screening for diagnostic chains (Dr. Lal PathLabs, SRL, Metropolis) bundling brain health with annual blood profiles.
- **B2C Premium Family Plan**: ₹499/year per elder for longitudinal family trends and tele-consultation referrals.

---

## 04. Technical Architecture: A Well-Built Product That Can Scale

### System Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│                        PATIENT / CLINIC CLIENT                         │
│   React 18 + Vite + Tailwind CSS + Framer Motion + Web Speech API      │
│   Google MediaPipe WebAssembly / WebGL (On-Device Zero-Server Compute) │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS / TLS
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    NEULENS SERVER (Google Cloud Run)                   │
│   Node.js + Express + TypeScript + Prisma ORM + Zod Validation         │
│   FHIR R4 Interoperability + Longitudinal Baseline RCI Engine          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼──────────────┐   ┌─────────────▼───────────────────┐
│     AI SERVICE (Cloud Run)       │   │     POSTGRESQL & CLOUD SQL      │
│   FastAPI + Python 3.14          │   │   Patients, Sessions,           │
│   Librosa Acoustic Processing    │   │   Baselines, Audit Logs         │
│   Google Gemini 2.5 Flash Client │   │                                 │
└──────────────────────────────────┘   └─────────────────────────────────┘
```

### Privacy & Edge Efficiency
- **Zero Raw Video Transmission**: Google MediaPipe runs entirely client-side in the patient's browser. Camera frames are processed into coordinate landmarks in memory and discarded. No facial photos or videos ever leave the device.
- **Compliance**: Fully designed in compliance with India's **Digital Personal Data Protection (DPDP) Act 2023** and **HIPAA/FHIR R4** standards.
- **Frugal Compute**: Because heavy video tracking is offloaded to client WebAssembly, our cloud backend handles thousands of concurrent sessions at minimal cost.

---

## 05. Use of Google AI & Google Cloud

| Google Product | Deep Integration in NeuLens |
| :--- | :--- |
| **Google Antigravity** | Autonomous agentic development, codebase supervision, refactoring, and continuous build verification. |
| **Google Agent Skills** | Operational platform skill authored at `.agents/skills/neulens-platform/SKILL.md` for agent governance. |
| **Google Gemini 2.5 Flash** | Powers the multilingual clinical reasoning engine, generating natural-language longitudinal change explanations and clinician decision support reports (`explanation.py`, `assistantLlm.ts`). |
| **Google MediaPipe** | Client-side sub-pixel iris tracking and 478 3D facial mesh running on WebAssembly/WebGL for zero-latency, privacy-safe biometric extraction. |
| **Google Cloud Run** | Fully containerized microservices ready for zero-to-n auto-scaling on Google Cloud Run with minimal idle cost. |
| **Google Cloud Storage** | Encrypted, HIPAA-compliant storage for signed clinical screening records and longitudinal summaries. |

---

## Competitive Differentiation

| Metric | Traditional Neuropsychology (MMSE/MoCA) | Hardware Eye Trackers (Tobii, etc.) | **NeuLens** |
| :--- | :--- | :--- | :--- |
| **Cost** | ₹2,500 – ₹10,000 | ₹2,00,000+ equipment | **Near Zero (₹0 to ₹50)** |
| **Time to Complete** | 45 – 90 minutes | 30 minutes | **5 minutes** |
| **Hardware Required** | Clinical office & pen-and-paper | Specialized IR cameras | **Any phone, tablet, or laptop** |
| **Literacy Dependency** | High (English reading/writing required) | Moderate | **None (Spoken vernacular audio & pictograms)** |
| **Indian Languages** | Poor / generic translations | English only | **English, Tamil, Hindi native** |
| **Longitudinal Tracking** | Cross-sectional population norms | Isolated metric | **Personal baseline anchor with RCI ($\Delta \le -5.0$)** |
| **AI Integration** | None | Proprietary black-box | **Google Gemini + Google MediaPipe** |

---

## Roadmap: Startup Buildathon to Market

```
[Phase 1: Buildathon (Now)]
• Google MediaPipe client-side eye & face tracking
• Google Gemini 2.5 Flash clinical explanation & copilot
• Native English, Tamil, Hindi support & Indian cultural stimuli
• Longitudinal personal baseline RCI engine

[Phase 2: Clinical Pilot (Months 1-3)]
• Ethical review & 250-patient pilot at partner memory clinic (Chennai/Bengaluru)
• Validation against MoCA and clinical dementia rating (CDR)
• Deployment on Google Cloud Run with Ayushman Bharat Digital Mission (ABDM) sandbox

[Phase 3: Commercial Rollout (Months 4-6)]
• Onboarding 15 private geriatric care networks and 50 memory clinics
• Launch B2C family monitoring subscription on Google Play Store
• Expansion to Telugu (te), Kannada (kn), and Bengali (bn)
```

---

*Authored under Google Antigravity Agent Supervision for the Google Startup Buildathon India 2026.*
