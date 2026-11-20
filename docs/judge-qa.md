# NeuLens Judge & Mentor Q&A — Startup Buildathon India 2026

## 1. What does NeuLens actually do?
NeuLens turns any everyday smartphone, tablet, or laptop into a 5-minute multimodal cognitive screening battery. It measures ocular micro-movements, visual memory with culturally familiar Indian stimuli, vocal cadence in Indian languages (Tamil, Hindi, English), and 3D facial affective dynamics. It then anchors these results against the individual's own personal baseline and uses Google Gemini 2.5 Flash to generate a structured decision-support summary for a reviewing clinician.

## 2. Is this a diagnostic tool? Does AI diagnose the patient?
**No, and that is by design.** NeuLens is an early-warning screening and clinical decision support platform, not a diagnostic device. It strictly enforces safety guardrails refusing to make diagnostic statements (e.g., "you have dementia"). Scoring is 100% deterministic, while Google Gemini synthesizes an evidence summary that a licensed clinician must review and sign off on.

## 3. How deeply does NeuLens utilize Google AI and Google Cloud?
NeuLens deeply embeds Google's AI and cloud technology at every tier of the stack:
- **Google Antigravity & Agent Skills**: The entire codebase architecture, agentic skills (`.agents/skills/neulens-platform/SKILL.md`), and automated verification pipelines are supervised by Google Antigravity.
- **Google MediaPipe**: Runs WebAssembly/WebGL iris and 478-point 3D facial mesh tracking client-side in the browser with 0 ms server lag and zero cloud GPU costs.
- **Google Gemini 2.5 Flash**: Powers multimodal conversational screening assistance and clinician decision support reports (`assistantLlm.ts` and `explanation.py`).
- **Google Cloud Platform**: Packaged for serverless deployment on Google Cloud Run, Cloud SQL, and Google Cloud Storage.

## 4. How is NeuLens adapted for India’s diverse population?
- **Native Indian Languages**: Fully functional in English, Tamil (`ta`), and Hindi (`hi`), including voice prompts, tasks, and multilingual voice copilot.
- **Cultural Stimuli**: Replaces alien Western test items with universally familiar Indian objects: **Diya (🪔), Mango (🥭), Peacock (🦚), Lotus (🪷)**.
- **Education-Aware & Literacy-Inclusive**: Equipped with spoken vernacular audio readouts and visual pictograms so illiterate or low-literacy elders can comfortably complete tasks. Schooling years (`educationYears`) are recorded and normed to prevent false-positive referrals.
- **Personal Baseline Anchor**: Rather than comparing an Indian grandmother to Western population averages, NeuLens tracks changes against her own personal baseline ($\Delta \le -5.0$ Reliable Change Index).

## 5. What is the privacy posture? Is video recorded or stored?
**Zero raw video or facial photos ever leave the user's device.**
All computer vision is executed inside the browser's memory using Google MediaPipe WebAssembly. Only anonymized numerical vector coordinates are passed to our server. This ensures strict compliance with India's **Digital Personal Data Protection (DPDP) Act 2023** and international healthcare data standards.

## 6. What is the business model and path to market?
1. **B2B SaaS**: Licensed to hospitals, memory clinics (Apollo, Fortis, NIMHANS), and geriatric care networks for ₹15,000/month for clinician portals and EHR integration.
2. **Ayushman Bharat & Primary Health Centres (PHCs)**: Affordable public health deployment enabling ASHA and community health workers to screen rural seniors on low-cost tablets.
3. **B2C Family Subscription**: ₹499/year mobile companion enabling working professionals in Indian metros to monitor the cognitive health trajectory of aging parents back home.

## 7. What is the competitive advantage over MMSE or hardware eye-trackers?
- **Cost**: Traditional assessments cost ₹2,500–₹10,000; hardware eye trackers cost ₹2,00,000+. NeuLens costs ₹0 to ₹50 per screening.
- **Time**: 5 minutes vs 45–90 minutes.
- **Accessibility**: Zero literacy barrier through spoken Indian voice guidance vs heavy English reading/writing demands.
- **Longitudinal Sensitivity**: Within-person RCI tracking catches micro-declines months before standard pen-and-paper tests detect clinical deficit.
