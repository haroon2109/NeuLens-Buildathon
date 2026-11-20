import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BedDouble,
  Brain,
  CheckCircle2,
  ClipboardList,
  Database,
  HeartPulse,
  Info,
  Moon,
  Save,
  Stethoscope,
  Sun,
  Users
} from 'lucide-react';
import { patientPortalApi } from '../../../services/patientPortalApi';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import { usePatientPortalStore } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getPortalTranslation } from '../../../services/language/portalTranslations';
import { getPortalPagesCopy } from '../../../services/language/portalPagesCopy';
import { Card, InfoRow, Pill, PortalPageHeader, SectionTitle, formatDate, primaryButton, secondaryButton } from './ui';

const fieldClass =
  'w-full rounded-xl border border-line-strong bg-warm/70 px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-forest focus:bg-white focus:ring-4 focus:ring-forest/12';
const labelClass = 'mb-1.5 block text-[14px] font-semibold text-ink';

const rangeLabels = ['Very low', 'Low', 'Moderate', 'Good', 'Very good'];

const RangeField: React.FC<{
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  low?: string;
  high?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}> = ({ id, label, value, onChange, low = 'Low', high = 'High', min = 1, max = 5, step = 1, suffix }) => (
  <div>
    <div className="flex items-center justify-between gap-3">
      <label className={labelClass} htmlFor={id}>{label}</label>
      <span className="text-xs font-bold text-forest">{value}{suffix || (max === 5 ? '/5' : '')}</span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-forest"
    />
    <div className="mt-1 flex justify-between text-xs text-muted">
      <span>{low}</span><span>{high}</span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Screen 34 — Health Context Overview
// ---------------------------------------------------------------------------
export const HealthContextOverviewPage: React.FC = () => {
  const { sleep, wellbeing, health } = usePatientPortalStore();
  const { context } = usePatientOverview();
  const pt = getPortalTranslation(useLanguageStore().currentLanguage);
  const copy = getPortalPagesCopy(useLanguageStore().currentLanguage).contextPages.overview;
  const clinical = context.find((item) => item.source === 'clinical_metabolic');

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={pt.context.overview.eyebrow}
        title={pt.context.overview.title}
        description={pt.context.overview.description}
        actions={<Link to="/patient/context/sleep" className={primaryButton}>{copy.update}</Link>}
      />          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Moon, label: copy.sleep, value: copy.sleepValue(sleep.durationHours), detail: copy.sleepDetail(sleep.quality, sleep.awakenings), chip: 'mint', href: '/patient/context/sleep' },
          { icon: Activity, label: copy.activity, value: copy.activityValue(sleep.steps.toLocaleString()), detail: copy.activityDetail(sleep.activeMinutes), chip: 'mint', href: '/patient/context/sleep' },
          { icon: Users, label: copy.wellbeing, value: copy.wellbeingValue(wellbeing.mood), detail: copy.wellbeingDetail(wellbeing.stress), chip: 'amber', href: '/patient/context/wellbeing' },
          { icon: Stethoscope, label: copy.clinical, value: clinical?.values?.systolic && clinical?.values?.diastolic ? `${clinical.values.systolic}/${clinical.values.diastolic}` : copy.notAvailable, detail: clinical ? copy.clinicalDetail : copy.noImport, chip: 'sage', href: '/patient/context/clinical' }
        ].map(({ icon: Icon, label, value, detail, chip, href }) => (
          <Link key={label} to={href} className="pp-card p-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg pp-icon-chip ${chip}`}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep">{label}</p>
            <p className="mt-1 text-[17px] font-semibold text-ink">{value}</p>
            <p className="mt-0.5 text-xs text-muted">{detail}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-forest">
              {copy.review} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <SectionTitle title={copy.sourcesTitle} detail={copy.sourcesDetail} />
          <ul className="space-y-2.5">
            {[
              { label: copy.selfSleep, source: copy.patientCheckIn, date: formatDate(new Date()), state: copy.current },
              { label: copy.selfWellbeing, source: copy.patientCheckIn, date: formatDate(new Date()), state: copy.current },
              ...context.map((item) => ({
                label:
                  item.source === 'clinical_metabolic'
                    ? copy.clinicalMeasurements
                    : item.source === 'sleep'
                    ? copy.sleepRecord
                    : item.source === 'wearable'
                    ? copy.wearableSummary
                    : copy.activityRecord,
                source: copy.patientRecorded,
                date: formatDate(item.recordedAt),
                state: item.consentGranted ? copy.consentRecorded : copy.consentMissing
              }))
            ].map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg pp-icon-chip white">
                    <Database className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">{item.label}</p>
                    <p className="text-xs text-muted">{item.source} · {item.date}</p>
                  </div>
                </div>
                <Pill tone={item.state === copy.consentMissing ? 'amber' : 'green'} dot>{item.state}</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.wearablesTitle} detail={copy.wearablesDetail} />
            <p className="text-xs leading-5 text-muted">
              {copy.wearablesBody}
            </p>
            <Link to="/patient/privacy" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline">
              {copy.manageDevices} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
          <Card>
          <SectionTitle title={copy.familyTitle} detail={copy.familyDetail} />
            <div className="flex flex-wrap gap-1.5">
              {health.conditions.length ? health.conditions.map((item) => <Pill key={item} tone="sage">{item}</Pill>) : <Pill tone="sage">{copy.noConditions}</Pill>}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              {health.familyHistory || copy.noFamily}
            </p>
            <Link to="/patient/context/clinical" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline">
              {copy.reviewHistory} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
          <div className="pp-notice">
            <Info className="h-3.5 w-3.5" />
            <span>{copy.notice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 35 — Sleep & Lifestyle
// ---------------------------------------------------------------------------
export const SleepLifestylePage: React.FC = () => {
  const { sleep, setSleep } = usePatientPortalStore();
  const pt = getPortalTranslation(useLanguageStore().currentLanguage);
  const copy = getPortalPagesCopy(useLanguageStore().currentLanguage).contextPages.sleep;
  const [saved, setSaved] = useState(false);
  const [wearableConsent, setWearableConsent] = useState(false);
  const [wearable, setWearable] = useState({ restingHr: '', steps: 0, sleepHours: 0 });
  const [wearableSaved, setWearableSaved] = useState(false);

  const saveWearable = async () => {
    if (!wearableConsent) return;
    await patientPortalApi.saveContextInput('wearable', {
      restingHeartRate: wearable.restingHr ? Number(wearable.restingHr) : null,
      steps: wearable.steps,
      sleepHours: wearable.sleepHours,
      reportedBy: 'PATIENT',
      source: 'wearable-summary'
    });
    setWearableSaved(true);
    window.setTimeout(() => setWearableSaved(false), 2600);
  };

  const save = async () => {
    await patientPortalApi.saveContextInput('sleep', {
      durationHours: sleep.durationHours,
      quality: sleep.quality,
      awakenings: sleep.awakenings
    });
    await patientPortalApi.saveContextInput('lifestyle_activity', {
      steps: sleep.steps,
      activeMinutes: sleep.activeMinutes,
      socialEngagement: sleep.socialEngagement
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={pt.context.sleep.eyebrow}
        title={pt.context.sleep.title}
        description={pt.context.sleep.description}
        actions={<Pill tone="blue" dot>{copy.lastUpdated}</Pill>}
      />

      <MotionReveal className="mx-auto w-full max-w-2xl">
        <HealthcareScene
          kind="sleeping"
          className="w-full"
          title={copy.sceneTitle}
        />
      </MotionReveal>

      {saved && (
        <div className="pp-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>{copy.savedNote}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title={copy.sleepTitle} detail={copy.sleepDetail} />
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="sleep-duration">{copy.avgDuration}</label>
              <div className="flex items-center gap-3">
                <input
                  id="sleep-duration"
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={sleep.durationHours}
                  onChange={(event) => setSleep({ durationHours: Number(event.target.value) })}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-forest"
                />
                <span className="w-16 text-[14px] font-bold text-forest">{copy.hours(sleep.durationHours)}</span>
              </div>
            </div>
            <RangeField id="sleep-quality" label={copy.qualityLabel} value={sleep.quality} onChange={(value) => setSleep({ quality: value })} low={copy.qualityLow} high={copy.qualityHigh} />
            <RangeField id="sleep-awakenings" label={copy.awakeningsLabel} value={sleep.awakenings} onChange={(value) => setSleep({ awakenings: value })} min={0} max={6} low={copy.awakeningLow} high={copy.awakeningHigh} suffix="" />
          </div>
        </Card>

        <Card>
          <SectionTitle title={copy.lifestyleTitle} detail={copy.lifestyleDetail} />
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="sleep-steps">{copy.avgSteps}</label>
              <input
                id="sleep-steps"
                type="number"
                min="0"
                max="30000"
                step="100"
                value={sleep.steps}
                onChange={(event) => setSleep({ steps: Number(event.target.value) })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sleep-active">{copy.activeMinutes}</label>
              <input
                id="sleep-active"
                type="number"
                min="0"
                max="240"
                value={sleep.activeMinutes}
                onChange={(event) => setSleep({ activeMinutes: Number(event.target.value) })}
                className={fieldClass}
              />
            </div>
            <RangeField id="sleep-social" label={copy.socialLabel} value={sleep.socialEngagement} onChange={(value) => setSleep({ socialEngagement: value })} low={copy.socialLow} high={copy.socialHigh} />
          </div>
        </Card>
      </div>

      {wearableSaved && (
        <div className="pp-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>{copy.wearableSaved}</span>
        </div>
      )}

      <Card>
        <SectionTitle title={copy.wearableTitle} detail={copy.wearableDetail} />
        <label className="flex items-start gap-2 text-xs leading-5 text-body" htmlFor="wearable-consent">
          <input
            id="wearable-consent"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
            checked={wearableConsent}
            onChange={(event) => setWearableConsent(event.target.checked)}
          />
          <span>{copy.consent}</span>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="wearable-hr">{copy.restingHr}</label>
            <input
              id="wearable-hr"
              type="number"
              min="40"
              max="120"
              disabled={!wearableConsent}
              value={wearable.restingHr}
              onChange={(event) => setWearable({ ...wearable, restingHr: event.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="wearable-steps">{copy.avgStepsShort}</label>
            <input
              id="wearable-steps"
              type="number"
              min="0"
              max="50000"
              step="100"
              disabled={!wearableConsent}
              value={wearable.steps}
              onChange={(event) => setWearable({ ...wearable, steps: Number(event.target.value) })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="wearable-sleep">{copy.avgSleep}</label>
            <input
              id="wearable-sleep"
              type="number"
              min="0"
              max="14"
              step="0.5"
              disabled={!wearableConsent}
              value={wearable.sleepHours}
              onChange={(event) => setWearable({ ...wearable, sleepHours: Number(event.target.value) })}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" className={primaryButton} onClick={() => void saveWearable()} disabled={!wearableConsent}>
            <Save className="h-4 w-4" /> {copy.saveWearable}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">{copy.wearableNote}</p>
      </Card>

      <Card>
        <SectionTitle title={copy.notesTitle} detail={copy.notesDetail} />
        <textarea
          rows={3}
          value={sleep.notes}
          onChange={(event) => setSleep({ notes: event.target.value })}
          className={fieldClass}
          placeholder={copy.notesPlaceholder}
        />
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted">{copy.notesHint}</p>
          <button type="button" className={primaryButton} onClick={save}>
            <Save className="h-4 w-4" /> {copy.saveContext}
          </button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link to="/patient/context/wellbeing" className={secondaryButton}>{copy.wellbeingLink} <ArrowRight className="h-3.5 w-3.5" /></Link>
        <Link to="/patient/context/clinical" className={secondaryButton}>{copy.clinicalLink}</Link>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 36 — Mental Wellbeing
// ---------------------------------------------------------------------------
export const MentalWellbeingPage: React.FC = () => {
  const { wellbeing, setWellbeing } = usePatientPortalStore();
  const pt = getPortalTranslation(useLanguageStore().currentLanguage);
  const copy = getPortalPagesCopy(useLanguageStore().currentLanguage).contextPages.wellbeing;
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await patientPortalApi.saveContextInput('mental_wellbeing', {
      mood: wellbeing.mood,
      stress: wellbeing.stress,
      motivation: wellbeing.motivation
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={pt.context.wellbeing.eyebrow}
        title={pt.context.wellbeing.title}
        description={pt.context.wellbeing.description}
        actions={<Pill tone="sage">{copy.optional}</Pill>}
      />

      <MotionReveal className="mx-auto w-full max-w-2xl">
        <HealthcareScene
          kind="social"
          className="w-full"
          title={copy.sceneTitle}
        />
      </MotionReveal>

      {saved && (
        <div className="pp-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>{copy.savedNote}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle title={copy.weekTitle} detail={copy.weekDetail} />
          <div className="space-y-6">
            <RangeField id="wellbeing-mood" label={copy.mood} value={wellbeing.mood} onChange={(value) => setWellbeing({ mood: value })} low={copy.moodLow} high={copy.moodHigh} />
            <RangeField id="wellbeing-stress" label={copy.stress} value={wellbeing.stress} onChange={(value) => setWellbeing({ stress: value })} low={copy.stressLow} high={copy.stressHigh} />
            <RangeField id="wellbeing-motivation" label={copy.motivation} value={wellbeing.motivation} onChange={(value) => setWellbeing({ motivation: value })} low={copy.motivationLow} high={copy.motivationHigh} />
          </div>
          <div className="mt-6">
            <label className={labelClass} htmlFor="wellbeing-notes">{copy.addNote}</label>
            <textarea
              id="wellbeing-notes"
              rows={3}
              value={wellbeing.notes}
              onChange={(event) => setWellbeing({ notes: event.target.value })}
              className={fieldClass}
              placeholder={copy.notePlaceholder}
            />
          </div>
          <button type="button" className={`${primaryButton} mt-4`} onClick={save}>
            <Save className="h-4 w-4" /> {copy.save}
          </button>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="flex items-center gap-1.5 text-xs font-bold text-sage-deep">
              <Brain className="h-3.5 w-3.5" /> {copy.reminderTitle}
            </p>
            <p className="mt-2 text-[14px] leading-6 text-body">
              {copy.reminderBody}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {copy.ranges.slice(0, 4).map((label) => <Pill key={label} tone="sage">{label}</Pill>)}
            </div>
          </Card>

          <div className="rounded-xl border border-amber/60 bg-amber/10 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Info className="h-3.5 w-3.5" /> {copy.instrumentsTitle}
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-900/80">
              {copy.instrumentsBody}
            </p>
          </div>

          <Card>
            <SectionTitle title={copy.supportTitle} />
            <p className="text-xs leading-5 text-muted">
              {copy.supportBody}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-forest">
              <HeartPulse className="h-3.5 w-3.5" /> {copy.supportLine}
            </span>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 37 — Clinical & Family History
// ---------------------------------------------------------------------------
export const ClinicalFamilyHistoryPage: React.FC = () => {
  const { health, setHealth } = usePatientPortalStore();
  const { context } = usePatientOverview();
  const pt = getPortalTranslation(useLanguageStore().currentLanguage);
  const copy = getPortalPagesCopy(useLanguageStore().currentLanguage).contextPages.clinical;
  const clinical = context.find((item) => item.source === 'clinical_metabolic');
  const genomicRecord = context.find((item) => item.source === 'genomic');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Both records are saved as context inputs with the patient's consent. The
  // genomic record is only written when the patient has explicitly opted in.
  const saveContext = async () => {
    setSaving(true);
    setError(null);
    try {
      await patientPortalApi.saveContextInput('family_history', {
        familyHistory: health.familyHistory,
        conditions: health.conditions,
        medications: health.medications,
        reportedBy: 'PATIENT'
      });
      if (health.genomicConsent) {
        await patientPortalApi.saveContextInput('genomic', {
          genomicSummary: health.genomicSummary,
          reportedBy: 'PATIENT',
          interpretationByNeuLens: 'NONE'
        });
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={pt.context.clinical.eyebrow}
        title={pt.context.clinical.title}
        description={pt.context.clinical.description}
        actions={<Pill tone="blue" dot>{copy.patientMaintained}</Pill>}
      />

      {saved && (
        <div className="pp-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>{copy.savedNote}</span>
        </div>
      )}
      {error && (
        <div className="pp-notice" role="alert">
          <Info className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title={copy.conditionsTitle} detail={copy.conditionsDetail} />
          <div className="flex flex-wrap gap-1.5">
            {health.conditions.length ? health.conditions.map((item) => <Pill key={item} tone="slate">{item}</Pill>) : <Pill tone="slate">{copy.noneShared}</Pill>}
          </div>
          <div className="mt-4">
            <label className={labelClass} htmlFor="clinical-medications">{copy.medications}</label>
            <textarea
              id="clinical-medications"
              rows={3}
              value={health.medications}
              onChange={(event) => setHealth({ medications: event.target.value })}
              className={fieldClass}
              placeholder={copy.medicationsPlaceholder}
            />
          </div>
          <div className="mt-4">
            <label className={labelClass} htmlFor="clinical-family">{copy.familyHistory}</label>
            <textarea
              id="clinical-family"
              rows={3}
              value={health.familyHistory}
              onChange={(event) => setHealth({ familyHistory: event.target.value })}
              className={fieldClass}
              placeholder={copy.familyPlaceholder}
            />
          </div>
          <button
            type="button"
            className={`${primaryButton} mt-4`}
            onClick={saveContext}
            disabled={saving}
          >
            <Save className="h-4 w-4" /> {saving ? copy.saving : copy.saveHistory}
          </button>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.importedTitle} detail={copy.importedDetail} />
            {clinical ? (
              <>
                <dl>
                  <InfoRow label={copy.bloodPressure} value={`${clinical.values.systolic ?? '—'}/${clinical.values.diastolic ?? '—'} mmHg`} />
                  <InfoRow label={copy.glucose} value={clinical.values.glucose ? `${clinical.values.glucose} mg/dL` : copy.notAvailable} />
                  <InfoRow label={copy.medicationOnRecord} value={clinical.values.medication || copy.notListed} />
                  <InfoRow label={copy.source} value={copy.sourceValue} />
                  <InfoRow label={copy.lastUpdated} value={formatDate(clinical.recordedAt)} />
                </dl>
                <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-muted">
                  <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {copy.importedNote}
                </p>
              </>
            ) : (
              <p className="text-xs leading-5 text-muted">
                {copy.noClinical}
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle title={copy.genomicTitle} detail={copy.genomicDetail} />
            {genomicRecord ? (
              <p className="mb-3 text-xs leading-5 text-muted">
                {copy.genomicLast(formatDate(genomicRecord.recordedAt))}
              </p>
            ) : (
              <p className="mb-3 text-xs leading-5 text-muted">
                {copy.genomicNone}
              </p>
            )}
            <label className="flex items-start gap-2 text-xs leading-5 text-body" htmlFor="genomic-consent">
              <input
                id="genomic-consent"
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
                checked={health.genomicConsent}
                onChange={(event) => setHealth({ genomicConsent: event.target.checked })}
              />
              <span>
                {copy.genomicConsent}
              </span>
            </label>
            <div className="mt-3">
              <label className={labelClass} htmlFor="genomic-summary">{copy.genomicLabel}</label>
              <textarea
                id="genomic-summary"
                rows={3}
                disabled={!health.genomicConsent}
                value={health.genomicSummary}
                onChange={(event) => setHealth({ genomicSummary: event.target.value })}
                className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
                placeholder={copy.genomicPlaceholder}
              />
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {copy.genomicNote}
            </p>
          </Card>

          <Card>
            <SectionTitle title={copy.previousTitle} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">
                {!health.previousAssessments || health.previousAssessments === 'No previous assessments'
                  ? copy.noPrevious
                  : health.previousAssessments}
              </span>
              <Pill tone="slate">{copy.selfReported}</Pill>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {copy.previousNote}
            </p>
          </Card>

          <div className="pp-notice">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>{copy.dataLabels}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/patient/context" className={secondaryButton}><Sun className="h-3.5 w-3.5" /> {copy.contextOverview}</Link>
        <Link to="/patient/privacy" className={secondaryButton}><BedDouble className="h-3.5 w-3.5" /> {copy.privacySharing}</Link>
      </div>
    </div>
  );
};


