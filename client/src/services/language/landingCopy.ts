import type { SupportedLanguage } from './types';

export interface LandingCopy {
  nav: Array<{ label: string; href: string }>;
  header: {
    mainNav: string;
    mobileNav: string;
    openMenu: string;
    closeMenu: string;
    clinicianPortal: string;
    patientPortal: string;
    explore: string;
    skipToContent: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    lead: string;
    audience: string;
    patientPortal: string;
    explore: string;
    disclaimer: string;
    sceneTitle: string;
    illustrationNote: string;
    clinicianSupervised: string;
    fourTypes: string;
    oneSession: string;
  };
  tagline: {
    eyebrow: string;
    statement: string;
    body: string;
  };
  challenge: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Array<{ number: string; title: string; detail: string }>;
    principle: string;
    principleBody: string;
  };
  approach: {
    eyebrow: string;
    title: string;
    lead: string;
    benefits: Array<{ title: string; detail: string }>;
    footnote: string;
    sceneTitle: string;
    illustrationNote: string;
  };
  measurement: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    pillarLabel: string;
    footerNote: string;
    pillars: Array<{ title: string; description: string; tags: string[]; sceneTitle: string }>;
  };
  how: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Array<{ number: string; title: string; detail: string }>;
    note: string;
  };
  baseline: {
    eyebrow: string;
    title: string;
    lead: string;
    points: Array<{ title: string; body: string }>;
    sceneTitle: string;
    flow: Array<{ label: string; note: string }>;
    flowNote: string;
    note: string;
  };
  context: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Array<{ title: string; detail: string }>;
    footnote: string;
    sceneTitle: string;
    illustrationNote: string;
  };
  oversight: {
    eyebrow: string;
    title: string;
    lead: string;
    isTitle: string;
    isBody: string;
    isNotTitle: string;
    isNotBody: string;
    principles: Array<{ title: string; detail: string }>;
    sceneTitle: string;
    clinicianInLoop: string;
    clinicianInLoopBody: string;
  };
  clinicians: {
    eyebrow: string;
    title: string;
    lead: string;
    audiences: Array<{ title: string; detail: string }>;
    demoCta: string;
    researchCta: string;
    note: string;
    sceneTitle: string;
    illustrationNote: string;
    reviewTag: string;
  };
  research: {
    eyebrow: string;
    title: string;
    lead: string;
    groups: Array<{ label: string; items: string[] }>;
    principles: Array<{ title: string; detail: string }>;
    noClaimTitle: string;
    noClaimBody: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    lead: string;
    askCta: string;
    items: Array<{ question: string; answer: string }>;
  };
  demoForm: {
    title: string;
    intro: string;
    fullName: string;
    namePlaceholder: string;
    nameError: string;
    email: string;
    emailPlaceholder: string;
    emailError: string;
    organization: string;
    organizationPlaceholder: string;
    organizationError: string;
    role: string;
    rolePlaceholder: string;
    roleError: string;
    roles: Array<{ value: string; label: string }>;
    message: string;
    messagePlaceholder: string;
    messageError: string;
    privacy: string;
    submit: string;
    submittedTitle: string;
    submittedBody: string;
    openDraft: string;
    newRequest: string;
    writeTo: string;
    emailSubject: (organization: string) => string;
    emailLabels: {
      name: string;
      email: string;
      organization: string;
      role: string;
      context: string;
      sentFrom: string;
    };
  };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    bullets: string[];
    preferEmail: string;
  };
  footer: {
    tagline: string;
    disclaimer: string;
    platformHeading: string;
    platformLinks: Array<{ label: string; href: string }>;
    clinicianHeading: string;
    clinicianLinks: Array<{ label: string; href: string }>;
    contactHeading: string;
    contactLink: string;
    clinicianPortal: string;
    patientPortal: string;
    contactNote: string;
    rights: string;
    bottomNote: string;
    platformNavLabel: string;
    clinicalNavLabel: string;
  };
}

export { en as enLandingCopy } from './landingCopy.en';
export { ar as arLandingCopy } from './landingCopy.ar';

import { en } from './landingCopy.en';
import { ar } from './landingCopy.ar';

/** Returns the landing-page copy for a language, falling back to English. */
export const getLandingCopy = (language: SupportedLanguage): LandingCopy =>
  language === 'ar' ? ar : en;
