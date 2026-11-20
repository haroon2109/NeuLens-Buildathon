import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Buildings,
  CaretDown,
  ChartLineUp,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  Cpu,
  Database,
  EnvelopeSimple,
  Eye,
  Flask,
  Heartbeat,
  List,
  LockKey,
  Microphone,
  ShieldCheck,
  Smiley,
  Stethoscope,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { HealthcareScene, type SceneKind } from '../../components/illustrations/HealthcareScene';
import { DemoRequestForm } from './DemoRequestForm';
import { PublicLanguageToggle } from '../../components/PublicLanguageToggle';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getLandingCopy } from '../../services/language/landingCopy';

/* -------------------------------------------------------------------------- */
/*  Shared building blocks                                                    */
/* -------------------------------------------------------------------------- */

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lp-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const TaglineReveal: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);
  const words = text.split(' ');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <h2 ref={ref} id="tagline-heading" className={`lp-tagline ${className}`} aria-label={text}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span
            aria-hidden="true"
            className={`lp-tagline-word ${visible ? 'is-visible' : ''}`}
            style={{ transitionDelay: `${index * 55}ms` }}
          >
            {word}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </h2>
  );
};

const SectionIntro: React.FC<{
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
  className?: string;
}> = ({ eyebrow, title, lead, center = false, className = '' }) => (
  <div className={`${center ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'} ${className}`}>
    <p className={`lp-eyebrow ${center ? 'justify-center' : ''}`}>{eyebrow}</p>
    <h2 className="lp-h2 mt-4">{title}</h2>
    {lead ? <p className="lp-lead mt-5">{lead}</p> : null}
  </div>
);

const Brand: React.FC<{ tone?: 'dark' | 'light'; className?: string }> = ({ className = '' }) => (
  <Link to="/" className={`inline-flex items-center shrink-0 ${className}`} aria-label="NeuLens home">
    <NeuLensLogo height="h-9" />
  </Link>
);

const IconBox: React.FC<{
  icon: React.ElementType;
  tone?: 'mint' | 'sage' | 'light';
  className?: string;
}> = ({ icon: Icon, tone = 'mint', className = '' }) => {
  const tones = {
    mint: 'bg-nl-mint text-nl-forest',
    sage: 'bg-nl-sage/25 text-nl-forest',
    light: 'bg-white/10 text-white',
  };

  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]} ${className}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export const LandingPage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentLanguage } = useLanguageStore();
  const copy = getLandingCopy(currentLanguage);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  const benefits = [
    {
      icon: Brain,
      title: copy.approach.benefits[0].title,
      detail: copy.approach.benefits[0].detail,
    },
    {
      icon: ClockCounterClockwise,
      title: copy.approach.benefits[1].title,
      detail: copy.approach.benefits[1].detail,
    },
    {
      icon: Stethoscope,
      title: copy.approach.benefits[2].title,
      detail: copy.approach.benefits[2].detail,
    },
    {
      icon: UsersThree,
      title: copy.approach.benefits[3].title,
      detail: copy.approach.benefits[3].detail,
    },
  ];

  const pillars: {
    index: string;
    title: string;
    description: string;
    tags: string[];
    icon: React.ElementType;
    scene: SceneKind;
    sceneTitle: string;
  }[] = [
    {
      index: '01',
      title: copy.measurement.pillars[0].title,
      description: copy.measurement.pillars[0].description,
      tags: copy.measurement.pillars[0].tags,
      icon: Brain,
      scene: 'cognitive',
      sceneTitle: copy.measurement.pillars[0].sceneTitle,
    },
    {
      index: '02',
      title: copy.measurement.pillars[1].title,
      description: copy.measurement.pillars[1].description,
      tags: copy.measurement.pillars[1].tags,
      icon: Eye,
      scene: 'eyeTracking',
      sceneTitle: copy.measurement.pillars[1].sceneTitle,
    },
    {
      index: '03',
      title: copy.measurement.pillars[2].title,
      description: copy.measurement.pillars[2].description,
      tags: copy.measurement.pillars[2].tags,
      icon: Microphone,
      scene: 'voice',
      sceneTitle: copy.measurement.pillars[2].sceneTitle,
    },
    {
      index: '04',
      title: copy.measurement.pillars[3].title,
      description: copy.measurement.pillars[3].description,
      tags: copy.measurement.pillars[3].tags,
      icon: Smiley,
      scene: 'facial',
      sceneTitle: copy.measurement.pillars[3].sceneTitle,
    },
  ];

  const steps = [
    {
      number: '01',
      title: copy.how.steps[0].title,
      detail: copy.how.steps[0].detail,
    },
    {
      number: '02',
      title: copy.how.steps[1].title,
      detail: copy.how.steps[1].detail,
    },
    {
      number: '03',
      title: copy.how.steps[2].title,
      detail: copy.how.steps[2].detail,
    },
    {
      number: '04',
      title: copy.how.steps[3].title,
      detail: copy.how.steps[3].detail,
    },
  ];

  const contextItems = [
    {
      icon: Heartbeat,
      title: copy.context.items[0].title,
      detail: copy.context.items[0].detail,
    },
    {
      icon: ChartLineUp,
      title: copy.context.items[1].title,
      detail: copy.context.items[1].detail,
    },
    {
      icon: Database,
      title: copy.context.items[2].title,
      detail: copy.context.items[2].detail,
    },
    {
      icon: Stethoscope,
      title: copy.context.items[3].title,
      detail: copy.context.items[3].detail,
    },
  ];

  const faqs = [
    {
      question: copy.faq.items[0].question,
      answer: copy.faq.items[0].answer,
    },
    {
      question: copy.faq.items[1].question,
      answer: copy.faq.items[1].answer,
    },
    {
      question: copy.faq.items[2].question,
      answer: copy.faq.items[2].answer,
    },
    {
      question: copy.faq.items[3].question,
      answer: copy.faq.items[3].answer,
    },
    {
      question: copy.faq.items[4].question,
      answer: copy.faq.items[4].answer,
    },
    {
      question: copy.faq.items[5].question,
      answer: copy.faq.items[5].answer,
    },
    {
      question: copy.faq.items[6].question,
      answer: copy.faq.items[6].answer,
    },
    {
      question: copy.faq.items[7].question,
      answer: copy.faq.items[7].answer,
    },
  ];

  const researchStatus = [
    {
      label: copy.research.groups[0].label,
      tone: 'bg-nl-mint text-nl-forest border-nl-sage/60',
      items: copy.research.groups[0].items,
    },
    {
      label: copy.research.groups[1].label,
      tone: 'bg-nl-sage/20 text-nl-forest-deep border-nl-sage/60',
      items: copy.research.groups[1].items,
    },
    {
      label: copy.research.groups[2].label,
      tone: 'bg-nl-warm text-nl-body border-nl-line',
      items: copy.research.groups[2].items,
    },
  ];

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-nl-warm text-nl-body">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-nl-forest px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {copy.header.skipToContent}
      </a>

      {/* 1. Navigation ------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-nl-line/80 bg-nl-warm/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:grid xl:grid-cols-[1fr_auto_1fr] gap-4">
          <div className="flex items-center justify-start shrink-0">
            <Brand />
          </div>

          <nav
            aria-label={copy.header.mainNav}
            className="hidden items-center justify-center gap-5 xl:gap-7 xl:flex justify-self-center"
          >
            {copy.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-nl-body transition-colors hover:text-nl-forest"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 justify-self-end">
            <PublicLanguageToggle />
            <Link
              to="/doctor/login"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-nl-body transition-colors hover:text-nl-forest whitespace-nowrap lg:inline-flex"
            >
              <span>{copy.header.clinicianPortal}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
            <span className="hidden sm:inline-block">
              <Link to="/patient" className="lp-btn lp-btn-primary lp-btn-sm whitespace-nowrap">
                <span>{copy.header.patientPortal}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </span>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-nl-line bg-white text-nl-ink transition-colors hover:border-nl-sage-dark xl:hidden"
              aria-label={mobileOpen ? copy.header.closeMenu : copy.header.openMenu}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          id="mobile-navigation"
          className={`${
            mobileOpen ? 'block' : 'hidden'
          } absolute inset-x-0 top-full max-h-[calc(100vh-72px)] overflow-y-auto border-b border-nl-line bg-nl-warm shadow-[0_24px_48px_-32px_rgba(27,51,43,0.45)] xl:hidden`}
        >
          <nav aria-label={copy.header.mobileNav} className="lp-container py-5">
            <div className="grid gap-1">
              {copy.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex min-h-[2.9rem] items-center justify-between rounded-xl px-3 text-[0.97rem] font-medium text-nl-ink transition-colors hover:bg-white"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4 text-nl-sage-dark" aria-hidden="true" />
                </a>
              ))}
            </div>
            <div className="mt-4 grid gap-3 border-t border-nl-line pt-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-nl-muted">{copy.header.language}</span>
                <PublicLanguageToggle />
              </div>
              <Link to="/patient" onClick={closeMenu} className="lp-btn lp-btn-primary w-full">
                <span>{copy.header.patientPortal}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="#how-it-works" onClick={closeMenu} className="lp-btn lp-btn-secondary w-full">
                {copy.header.explore}
              </a>
              <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                <Link to="/doctor/login" className="font-medium text-nl-body hover:text-nl-forest">
                  {copy.header.clinicianPortal}
                </Link>
                <Link to="/patient" className="font-medium text-nl-body hover:text-nl-forest">
                  {copy.header.patientPortal}
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* 2. Hero --------------------------------------------------------- */}
        <section className="relative isolate overflow-hidden bg-nl-warm">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-28 top-4 h-[30rem] w-[30rem] rounded-full bg-nl-mint/80 sm:-right-20 sm:h-[34rem] sm:w-[34rem]" />
            <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-nl-sage/20" />
            <div className="absolute right-[41%] top-[18%] hidden h-36 w-36 rounded-full border border-nl-sage/40 lg:block" />
            <div className="absolute left-[46%] top-10 hidden h-3 w-3 rounded-full bg-nl-sage-dark/50 lg:block" />
          </div>

          <div className="lp-container relative pb-20 pt-14 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
              <div className="min-w-0">
                <p className="lp-eyebrow">{copy.hero.eyebrow}</p>
                <h1 className="lp-display mt-6">
                  {copy.hero.titleLine1}
                  <span className="block">{copy.hero.titleLine2}</span>
                </h1>
                <p className="lp-lead mt-6 max-w-[35rem]">{copy.hero.lead}</p>
                <p className="lp-small mt-4 max-w-[35rem] text-nl-muted">{copy.hero.audience}</p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link to="/patient" className="lp-btn lp-btn-primary">
                    {copy.hero.patientPortal}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a href="#how-it-works" className="lp-btn lp-btn-secondary">
                    {copy.hero.explore}
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                <div className="mt-9 flex items-start gap-2.5 border-t border-nl-line pt-5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nl-forest" aria-hidden="true" />
                  <p className="text-xs leading-5 text-nl-muted">{copy.hero.disclaimer}</p>
                </div>
              </div>

              <div className="relative mx-auto min-w-0 w-full max-w-[35rem] lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="absolute -right-4 top-1/2 h-[78%] w-[88%] -translate-y-1/2 rounded-[3rem] bg-nl-sage/35 sm:-right-6"
                />
                <div aria-hidden="true" className="absolute -left-4 -top-5 h-24 w-24 rounded-full bg-nl-mint sm:h-28 sm:w-28" />

                <div className="relative rounded-[2rem] border border-nl-line bg-white p-3 shadow-[0_2px_4px_rgba(27,51,43,0.03),0_40px_80px_-64px_rgba(27,51,43,0.55)] sm:p-4">
                  <div className="overflow-hidden rounded-[1.45rem] bg-nl-mint-soft">
                    <div className="lp-float">
                      <HealthcareScene
                        kind="heroCare"
                        className="rounded-[1.45rem]"
                        title={copy.hero.sceneTitle}
                        animated={false}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1.5 pb-1 pt-4">
                    <p className="max-w-[17rem] text-xs leading-5 text-nl-muted">
                      {copy.hero.illustrationNote}
                    </p>
                    <span className="lp-tag">
                      <ShieldCheck className="h-3.5 w-3.5 text-nl-forest" aria-hidden="true" />
                      {copy.hero.clinicianSupervised}
                    </span>
                  </div>
                </div>

                <div className="absolute -left-3 top-10 hidden items-center gap-2.5 rounded-xl border border-nl-line bg-white px-3.5 py-3 shadow-[0_16px_40px_-30px_rgba(27,51,43,0.5)] sm:flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-nl-mint text-nl-forest">
                    <Brain className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold leading-4 text-nl-ink">
                    {copy.hero.fourTypes}
                    <span className="block text-[12px] font-normal text-nl-muted">{copy.hero.oneSession}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tagline reveal -------------------------------------------------- */}
        <section className="lp-on-dark relative isolate overflow-hidden bg-nl-forest" aria-labelledby="tagline-heading">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/[0.04]" />
            <div className="absolute -bottom-40 right-[-4rem] h-[26rem] w-[26rem] rounded-full border border-white/10" />
            <div className="absolute right-[18%] top-10 h-24 w-24 rounded-full bg-nl-sage/10" />
          </div>
          <div className="lp-container relative py-20 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <p className="lp-eyebrow justify-center">{copy.tagline.eyebrow}</p>
              <div className="mt-8">
                <TaglineReveal text={copy.tagline.statement} />
              </div>
              <p className="lp-small mx-auto mt-8 max-w-2xl">{copy.tagline.body}</p>
            </div>
          </div>
        </section>

        {/* 3. The challenge ------------------------------------------------ */}
        <section id="challenge" className="lp-section bg-white">
          <div className="lp-container">
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
              <Reveal>
                <SectionIntro
                  eyebrow={copy.challenge.eyebrow}
                  title={copy.challenge.title}
                  lead={copy.challenge.lead}
                />
              </Reveal>

              <div className="grid gap-0 border-t border-nl-line">
                {[
                  ...copy.challenge.items
                ].map((item, index) => (
                  <Reveal key={item.number} delay={index * 70}>
                    <article className="grid gap-3 border-b border-nl-line py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-5 sm:py-8">
                      <p className="lp-caption pt-1">{item.number}</p>
                      <div>
                        <h3 className="lp-h3">{item.title}</h3>
                        <p className="lp-small mt-2.5 max-w-[34rem]">{item.detail}</p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal className="mt-12 lg:mt-16">
              <div className="lp-panel flex flex-col gap-5 p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
                <p className="lp-h3 max-w-3xl">{copy.challenge.principleBody}</p>
                <p className="lp-caption shrink-0">{copy.challenge.principle}</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 4. Approach & benefits ----------------------------------------- */}
        <section id="approach" className="lp-section bg-nl-warm">
          <div className="lp-container">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20">
              <Reveal className="order-2 lg:order-1">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-5 -left-4 h-[70%] w-[80%] rounded-[2.5rem] bg-nl-sage/30"
                  />
                  <div className="lp-card relative overflow-hidden p-3">
                    <HealthcareScene
                      kind="manWithDoctor"
                      className="rounded-[1.1rem]"
                      title={copy.approach.sceneTitle}
                      animated={false}
                    />
                    <p className="px-2 pb-1 pt-3 text-xs leading-5 text-nl-muted">
                      {copy.approach.illustrationNote}
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal className="order-1 lg:order-2">
                <SectionIntro
                  eyebrow={copy.approach.eyebrow}
                  title={copy.approach.title}
                  lead={copy.approach.lead}
                />
                <div className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="flex gap-3.5">
                      <IconBox icon={benefit.icon} />
                      <div>
                        <h3 className="lp-h4">{benefit.title}</h3>
                        <p className="lp-small mt-1.5 text-[0.9rem]">{benefit.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-8 flex items-start gap-2 text-xs leading-5 text-nl-muted">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nl-forest" aria-hidden="true" />
                  {copy.approach.footnote}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 5. Four measurement pillars ------------------------------------ */}
        <section id="measurement" className="lp-section bg-white">
          <div className="lp-container">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <Reveal>
                <SectionIntro
                  eyebrow={copy.measurement.eyebrow}
                  title={copy.measurement.title}
                  lead={copy.measurement.lead}
                />
              </Reveal>
              <Reveal delay={80}>
                <div className="flex max-w-sm items-start gap-3 rounded-2xl bg-nl-mint-soft p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-nl-forest" aria-hidden="true" />
                  <p className="text-xs leading-5 text-nl-body">{copy.measurement.note}</p>
                </div>
              </Reveal>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <Reveal key={pillar.title} delay={index * 60}>
                    <article className="lp-card h-full overflow-hidden">
                      <div className="bg-nl-mint-soft p-3">
                        <HealthcareScene
                          kind={pillar.scene}
                          className="rounded-[1rem]"
                          title={pillar.sceneTitle}
                          animated={false}
                        />
                      </div>
                      <div className="p-6 sm:p-7">
                        <div className="flex items-start gap-3.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nl-mint text-nl-forest">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="lp-caption">{copy.measurement.pillarLabel} {pillar.index}</p>
                            <h3 className="lp-h3 mt-0.5">{pillar.title}</h3>
                          </div>
                        </div>
                        <p className="lp-small mt-4">{pillar.description}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {pillar.tags.map((tag) => (
                            <span key={tag} className="lp-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="mt-5 border-t border-nl-line pt-4 text-xs font-medium text-nl-muted">
                          {copy.measurement.footerNote}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. How NeuLens works ------------------------------------------- */}
        <section id="how-it-works" className="lp-section bg-nl-mint-soft">
          <div className="lp-container">
            <Reveal>
              <SectionIntro
                eyebrow={copy.how.eyebrow}
                title={copy.how.title}
                lead={copy.how.lead}
              />
            </Reveal>

            <ol className="mt-12 grid gap-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {steps.map((step, index) => (
                <li key={step.number}>
                  <Reveal delay={index * 70}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-nl-sage-dark/60 bg-white text-sm font-semibold text-nl-forest">
                        {step.number}
                      </span>
                      {index < steps.length - 1 ? (
                        <span aria-hidden="true" className="hidden h-px flex-1 bg-nl-sage-dark/40 lg:block" />
                      ) : null}
                    </div>
                    <h3 className="lp-h3 mt-5">{step.title}</h3>
                    <p className="lp-small mt-2.5">{step.detail}</p>
                  </Reveal>
                </li>
              ))}
            </ol>

            <Reveal className="mt-12">
              <div className="flex flex-col gap-3 rounded-2xl border border-nl-sage/50 bg-white/70 p-5 sm:flex-row sm:items-center sm:gap-4">
                <ShieldCheck className="h-5 w-5 shrink-0 text-nl-forest" aria-hidden="true" />
                <p className="text-sm leading-6 text-nl-body">{copy.how.note}</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 7. Baseline & longitudinal monitoring --------------------------- */}
        <section id="baseline" className="lp-section bg-white">
          <div className="lp-container">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20">
              <Reveal>
                <SectionIntro
                  eyebrow={copy.baseline.eyebrow}
                  title={copy.baseline.title}
                  lead={copy.baseline.lead}
                />

                <ul className="lp-check-list mt-8">
                  {copy.baseline.points.map((point) => (
                    <li key={point.title}>
                      <CheckCircle className="h-5 w-5" aria-hidden="true" />
                      <span>
                        <strong className="font-semibold text-nl-ink">{point.title}</strong> {point.body}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={80}>
                <div className="lp-card overflow-hidden p-3">
                  <HealthcareScene
                    kind="longitudinal"
                    className="rounded-[1.1rem]"
                    title={copy.baseline.sceneTitle}
                    animated={false}
                  />
                  <div className="mt-3 rounded-[1.1rem] bg-nl-warm p-5 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                      {[
                        { icon: CheckCircle, ...copy.baseline.flow[0] },
                        { icon: ClockCounterClockwise, ...copy.baseline.flow[1] },
                        { icon: Eye, ...copy.baseline.flow[2] },
                      ].map((node, index) => {
                        const Icon = node.icon;
                        return (
                          <React.Fragment key={node.label}>
                            <div className="flex items-start gap-2.5 sm:block">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-nl-forest ring-1 ring-nl-line">
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <div className="sm:mt-2.5">
                                <p className="text-xs font-semibold text-nl-ink">{node.label}</p>
                                <p className="text-[12px] leading-4 text-nl-muted">{node.note}</p>
                              </div>
                            </div>
                            {index < 2 ? (
                              <ArrowRight
                                className="hidden h-4 w-4 text-nl-sage-dark sm:block"
                                aria-hidden="true"
                              />
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <p className="mt-5 border-t border-nl-line pt-4 text-[12px] leading-4 text-nl-muted">
                      {copy.baseline.flowNote}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 px-1 text-xs leading-5 text-nl-muted">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nl-forest" aria-hidden="true" />
                  {copy.baseline.note}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 8. Health-context integration ---------------------------------- */}
        <section id="health-context" className="lp-section bg-nl-warm">
          <div className="lp-container">
            <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-20">
              <Reveal className="order-2 lg:order-1">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-nl-mint"
                  />
                  <div className="lp-card relative overflow-hidden p-3">
                    <HealthcareScene
                      kind="contextReview"
                      className="rounded-[1.1rem]"
                      title={copy.context.sceneTitle}
                      animated={false}
                    />
                    <p className="px-2 pb-1 pt-3 text-xs leading-5 text-nl-muted">
                      {copy.context.illustrationNote}
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal className="order-1 lg:order-2">
                <SectionIntro
                  eyebrow={copy.context.eyebrow}
                  title={copy.context.title}
                  lead={copy.context.lead}
                />
                <div className="mt-8 grid gap-0 border-t border-nl-line">
                  {contextItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="grid gap-3 border-b border-nl-line py-5 sm:grid-cols-[2.75rem_1fr] sm:gap-4"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-nl-forest ring-1 ring-nl-line">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="lp-h4">{item.title}</h3>
                          <p className="lp-small mt-1 text-[0.9rem]">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-5 text-xs leading-5 text-nl-muted">{copy.context.footnote}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 9. Clinical oversight & safety ---------------------------------- */}
        <section id="clinical-oversight" className="lp-section bg-white">
          <div className="lp-container">
            <Reveal>
              <SectionIntro
                eyebrow={copy.oversight.eyebrow}
                title={copy.oversight.title}
                lead={copy.oversight.lead}
              />
            </Reveal>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
              <div className="grid gap-5 sm:grid-cols-2">
                <Reveal>
                  <div className="lp-card h-full p-6 sm:p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nl-mint text-nl-forest">
                      <CheckCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="lp-h3 mt-5">{copy.oversight.isTitle}</h3>
                    <p className="lp-small mt-2.5">{copy.oversight.isBody}</p>
                  </div>
                </Reveal>
                <Reveal delay={70}>
                  <div className="lp-card h-full p-6 sm:p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nl-warm text-nl-forest ring-1 ring-nl-line">
                      <X className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="lp-h3 mt-5">{copy.oversight.isNotTitle}</h3>
                    <p className="lp-small mt-2.5">{copy.oversight.isNotBody}</p>
                  </div>
                </Reveal>

                <div className="sm:col-span-2">
                  <div className="grid gap-x-8 gap-y-6 border-t border-nl-line pt-7 sm:grid-cols-2">
                    {[
                      ...copy.oversight.principles,
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-nl-forest" aria-hidden="true" />
                        <div>
                          <h3 className="text-sm font-semibold text-nl-ink">{item.title}</h3>
                          <p className="lp-small mt-1 text-[0.875rem]">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Reveal delay={100}>
                <div className="lp-panel h-full p-3">
                  <HealthcareScene
                    kind="clinicalReview"
                    className="rounded-[1.1rem]"
                    title={copy.oversight.sceneTitle}
                    animated={false}
                  />
                  <div className="flex items-start gap-3 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-nl-forest" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-nl-ink">{copy.oversight.clinicianInLoop}</p>
                      <p className="mt-1 text-xs leading-5 text-nl-muted">
                        {copy.oversight.clinicianInLoopBody}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 10. For healthcare professionals -------------------------------- */}
        <section id="for-clinicians" className="lp-on-dark lp-section relative isolate overflow-hidden bg-nl-forest">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-white/[0.045]" />
            <div className="absolute -bottom-32 -left-20 h-[22rem] w-[22rem] rounded-full border border-white/10" />
          </div>

          <div className="lp-container relative">
            <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
              <Reveal>
                <SectionIntro
                  eyebrow={copy.clinicians.eyebrow}
                  title={copy.clinicians.title}
                  lead={copy.clinicians.lead}
                />

                <div className="mt-8 grid gap-0 border-t border-white/15">
                  {[
                    {
                      icon: Stethoscope,
                      ...copy.clinicians.audiences[0],
                    },
                    {
                      icon: Buildings,
                      ...copy.clinicians.audiences[1],
                    },
                    {
                      icon: Flask,
                      ...copy.clinicians.audiences[2],
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="grid gap-3 border-b border-white/15 py-5 sm:grid-cols-[2.75rem_1fr] sm:gap-4"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="lp-h4">{item.title}</h3>
                          <p className="lp-small mt-1 text-[0.9rem]">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#contact" className="lp-btn lp-btn-light">
                    {copy.clinicians.demoCta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a href="#contact" className="lp-btn lp-btn-outline-light">
                    {copy.clinicians.researchCta}
                  </a>
                </div>
                <p className="mt-4 text-xs leading-5 text-white/75">{copy.clinicians.note}</p>
              </Reveal>

              <Reveal delay={90}>
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-4 -right-4 h-[70%] w-[80%] rounded-[2.5rem] bg-nl-sage/20"
                  />
                  <div className="relative rounded-[1.75rem] bg-white p-3">
                    <HealthcareScene
                      kind="aboutTeam"
                      className="rounded-[1.2rem]"
                      title={copy.clinicians.sceneTitle}
                      animated={false}
                    />
                    <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-3">
                      <p className="text-xs leading-5 text-nl-muted">{copy.clinicians.illustrationNote}</p>
                      <span className="lp-tag shrink-0 text-[12px]">{copy.clinicians.reviewTag}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 11. Technology & research approach ------------------------------ */}
        <section id="research" className="lp-section bg-nl-warm">
          <div className="lp-container">
            <Reveal>
              <SectionIntro
                eyebrow={copy.research.eyebrow}
                title={copy.research.title}
                lead={copy.research.lead}
              />
            </Reveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {researchStatus.map((group, index) => (
                <Reveal key={group.label} delay={index * 70}>
                  <div className="lp-card h-full p-6 sm:p-7">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.09em] ${group.tone}`}
                    >
                      {group.label}
                    </span>
                    <ul className="mt-6 grid gap-3.5">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-nl-sage-deep" aria-hidden="true" />
                          <span className="text-sm leading-6 text-nl-body">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-12 grid gap-8 border-t border-nl-line pt-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    icon: LockKey,
                    ...copy.research.principles[0],
                  },
                  {
                    icon: Cpu,
                    ...copy.research.principles[1],
                  },
                  {
                    icon: Flask,
                    ...copy.research.principles[2],
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-nl-forest ring-1 ring-nl-line">                          <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-nl-ink">{item.title}</h3>
                      <p className="lp-small mt-1 text-[0.875rem]">{item.detail}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-nl-sage/50 bg-white p-5 sm:p-6">
                <p className="lp-caption">{copy.research.noClaimTitle}</p>
                <p className="lp-small mt-3">{copy.research.noClaimBody}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 12. FAQ --------------------------------------------------------- */}
        <section id="faq" className="lp-section bg-white">
          <div className="lp-container">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <Reveal>
                <div className="lg:sticky lg:top-28">
                  <SectionIntro
                    eyebrow={copy.faq.eyebrow}
                    title={copy.faq.title}
                    lead={copy.faq.lead}
                  />
                  <a href="#contact" className="lp-btn lp-btn-secondary mt-7">
                    {copy.faq.askCta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </Reveal>

              <Reveal delay={60}>
                <div className="border-t border-nl-line">
                  {faqs.map((faq, index) => (
                    <details key={faq.question} className="lp-faq" open={index === 0}>
                      <summary>
                        <span>{faq.question}</span>
                        <CaretDown className="h-4 w-4" aria-hidden="true" />
                      </summary>
                      <div className="lp-faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 13. Final clinical demo CTA ------------------------------------ */}
        <section id="contact" className="lp-section-sm bg-nl-warm pb-16 sm:pb-20">
          <div className="lp-container">
            <div className="lp-card overflow-hidden">
              <div className="grid lg:grid-cols-[1fr_1fr]">
                <div className="relative overflow-hidden bg-nl-forest p-7 text-white sm:p-10 lg:p-12">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.05]" />
                    <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full border border-white/10" />
                  </div>
                  <div className="relative lp-on-dark">
                    <p className="lp-eyebrow">{copy.contact.eyebrow}</p>
                    <h2 className="lp-h2 mt-4">{copy.contact.title}</h2>
                    <p className="lp-lead mt-5 max-w-lg">{copy.contact.lead}</p>

                    <ul className="lp-check-list mt-7">
                      {copy.contact.bullets.map((bullet) => (
                        <li key={bullet}>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 border-t border-white/15 pt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                        {copy.contact.preferEmail}
                      </p>
                      <a
                        href="mailto:neulens.ai@gmail.com"
                        className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
                      >
                        <EnvelopeSimple className="h-4 w-4" aria-hidden="true" />
                        neulens.ai@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-7 sm:p-10 lg:p-12">
                  <DemoRequestForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 14. Footer -------------------------------------------------------- */}
      <footer className="bg-nl-forest-deep text-white">
        <div className="lp-container py-14 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.9fr] lg:gap-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <Brand tone="light" />
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/65">{copy.footer.tagline}</p>
              <p className="mt-5 max-w-sm text-xs leading-5 text-white/65">{copy.footer.disclaimer}</p>
            </div>

            <nav aria-label={copy.footer.platformNavLabel}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/65">{copy.footer.platformHeading}</h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                {copy.footer.platformLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-white/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={copy.footer.clinicalNavLabel}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/65">{copy.footer.clinicianHeading}</h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                {copy.footer.clinicianLinks.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-white/70 transition-colors hover:text-white">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/65">{copy.footer.contactHeading}</h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                <li>
                  <a
                    href="mailto:neulens.ai@gmail.com"
                    className="inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white"
                  >
                    <EnvelopeSimple className="h-4 w-4" aria-hidden="true" />
                    neulens.ai@gmail.com
                  </a>
                </li>
                <li>
                  <a href="#contact" className="inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white">
                    {copy.footer.contactLink}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              </ul>
              <p className="mt-5 text-xs leading-5 text-white/65">{copy.footer.contactNote}</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
            <p>{copy.footer.rights}</p>
            <p>{copy.footer.bottomNote}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
