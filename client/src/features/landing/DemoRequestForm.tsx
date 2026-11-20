import { useState } from 'react';
import { CheckCircle, EnvelopeSimple, PaperPlaneRight, ShieldCheck } from '@phosphor-icons/react';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getLandingCopy } from '../../services/language/landingCopy';

type Field = {
  value: string;
  error: string;
};

type FormState = {
  name: Field;
  email: Field;
  organization: Field;
  role: Field;
  message: Field;
};

const emptyForm: FormState = {
  name: { value: '', error: '' },
  email: { value: '', error: '' },
  organization: { value: '', error: '' },
  role: { value: '', error: '' },
  message: { value: '', error: '' },
};

const DEMO_EMAIL = 'neulens.ai@gmail.com';

type Props = {
  className?: string;
};

export const DemoRequestForm: React.FC<Props> = ({ className = '' }) => {
  const copy = getLandingCopy(useLanguageStore((state) => state.currentLanguage));
  const roles = copy.demoForm.roles;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [mailtoUrl, setMailtoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: { value, error: '' } }));
  };

  const validate = (): boolean => {
    const next = { ...form };
    let valid = true;

    if (form.name.value.trim().length < 2) {
      next.name = { ...next.name, error: copy.demoForm.nameError };
      valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) {
      next.email = { ...next.email, error: copy.demoForm.emailError };
      valid = false;
    }

    if (form.organization.value.trim().length < 2) {
      next.organization = { ...next.organization, error: copy.demoForm.organizationError };
      valid = false;
    }

    if (!roles.some((role) => role.value === form.role.value)) {
      next.role = { ...next.role, error: copy.demoForm.roleError };
      valid = false;
    }

    if (form.message.value.trim().length < 10) {
      next.message = { ...next.message, error: copy.demoForm.messageError };
      valid = false;
    }

    setForm(next);
    return valid;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const roleLabel = roles.find((role) => role.value === form.role.value)?.label ?? form.role.value;
    const subject = copy.demoForm.emailSubject(form.organization.value.trim());
    const body = [
      `${copy.demoForm.emailLabels.name}: ${form.name.value.trim()}`,
      `${copy.demoForm.emailLabels.email}: ${form.email.value.trim()}`,
      `${copy.demoForm.emailLabels.organization}: ${form.organization.value.trim()}`,
      `${copy.demoForm.emailLabels.role}: ${roleLabel}`,
      '',
      `${copy.demoForm.emailLabels.context}:`,
      form.message.value.trim(),
      '',
      copy.demoForm.emailLabels.sentFrom,
    ].join('\n');

    const url = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMailtoUrl(url);
    setSubmitted(true);

    // There is no demo-booking backend in this prototype. A prepared email is
    // the honest handoff: the visitor sees exactly what will be sent.
    window.location.href = url;
  };

  const reset = () => {
    setForm(emptyForm);
    setMailtoUrl('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className={className} role="status" aria-live="polite">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nl-mint text-nl-forest">
          <CheckCircle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="lp-h3 mt-5">{copy.demoForm.submittedTitle}</h3>
        <p className="lp-small mt-3">{copy.demoForm.submittedBody}</p>

        <a href={mailtoUrl} className="lp-btn lp-btn-primary mt-6 w-full">
          <EnvelopeSimple className="h-4 w-4" aria-hidden="true" />
          {copy.demoForm.openDraft}
        </a>
        <button
          type="button"
          onClick={reset}
          className="mt-3 min-h-[2.75rem] w-full rounded-xl px-4 text-sm font-semibold text-nl-forest transition-colors hover:bg-nl-mint-soft"
        >
          {copy.demoForm.newRequest}
        </button>

        <p className="mt-5 border-t border-nl-line pt-4 text-xs leading-5 text-nl-muted">
          {copy.demoForm.writeTo}{' '}
          <a
            href={`mailto:${DEMO_EMAIL}`}
            className="font-semibold text-nl-forest underline decoration-nl-sage-dark/40 underline-offset-2"
          >
            {DEMO_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form className={className} onSubmit={handleSubmit} noValidate>
      <h3 className="lp-h3">{copy.demoForm.title}</h3>
      <p className="lp-small mt-2 text-[0.9rem]">{copy.demoForm.intro}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="demo-name" className="lp-field-label">
            {copy.demoForm.fullName}
          </label>
          <input
            id="demo-name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name.value}
            onChange={(event) => update('name', event.target.value)}
            placeholder={copy.demoForm.namePlaceholder}
            className="lp-input"
            aria-describedby={form.name.error ? 'demo-name-error' : undefined}
            aria-invalid={form.name.error ? true : undefined}
          />
          {form.name.error ? (
            <p id="demo-name-error" className="mt-1.5 text-xs text-rose" role="alert">
              {form.name.error}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="demo-email" className="lp-field-label">
            {copy.demoForm.email}
          </label>
          <input
            id="demo-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email.value}
            onChange={(event) => update('email', event.target.value)}
            placeholder="a.rahman@hospital.org"
            className="lp-input"
            aria-describedby={form.email.error ? 'demo-email-error' : undefined}
            aria-invalid={form.email.error ? true : undefined}
          />
          {form.email.error ? (
            <p id="demo-email-error" className="mt-1.5 text-xs text-rose" role="alert">
              {form.email.error}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="demo-organization" className="lp-field-label">
            {copy.demoForm.organization}
          </label>
          <input
            id="demo-organization"
            name="organization"
            type="text"
            autoComplete="organization"
            value={form.organization.value}
            onChange={(event) => update('organization', event.target.value)}
            placeholder={copy.demoForm.organizationPlaceholder}
            className="lp-input"
            aria-describedby={form.organization.error ? 'demo-organization-error' : undefined}
            aria-invalid={form.organization.error ? true : undefined}
          />
          {form.organization.error ? (
            <p id="demo-organization-error" className="mt-1.5 text-xs text-rose" role="alert">
              {form.organization.error}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="demo-role" className="lp-field-label">
            {copy.demoForm.role}
          </label>
          <select
            id="demo-role"
            name="role"
            value={form.role.value}
            onChange={(event) => update('role', event.target.value)}
            className="lp-input"
            aria-describedby={form.role.error ? 'demo-role-error' : undefined}
            aria-invalid={form.role.error ? true : undefined}
          >
            <option value="" disabled>
              {copy.demoForm.rolePlaceholder}
            </option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {form.role.error ? (
            <p id="demo-role-error" className="mt-1.5 text-xs text-rose" role="alert">
              {form.role.error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="demo-message" className="lp-field-label">
          {copy.demoForm.message}
        </label>
        <textarea
          id="demo-message"
          name="message"
          rows={4}
          value={form.message.value}
          onChange={(event) => update('message', event.target.value)}
          placeholder={copy.demoForm.messagePlaceholder}
          className="lp-input resize-y"
          aria-describedby={form.message.error ? 'demo-message-error' : undefined}
          aria-invalid={form.message.error ? true : undefined}
        />
        {form.message.error ? (
          <p id="demo-message-error" className="mt-1.5 text-xs text-rose" role="alert">
            {form.message.error}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nl-forest" aria-hidden="true" />
        <p className="text-xs leading-5 text-nl-muted">{copy.demoForm.privacy}</p>
      </div>

      <button type="submit" className="lp-btn lp-btn-primary mt-6 w-full">
        <PaperPlaneRight className="h-4 w-4" aria-hidden="true" />
        {copy.demoForm.submit}
      </button>
    </form>
  );
};

export default DemoRequestForm;
