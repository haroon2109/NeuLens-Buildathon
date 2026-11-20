/**
 * Deployment-specific identity and contact details.
 *
 * Nothing here is fabricated. Values come from build-time Vite variables
 * (VITE_CLINIC_* / VITE_SUPPORT_*) and fall back to neutral, non-specific
 * labels so the product never claims to be a particular hospital, clinic or
 * phone number that does not exist. Configure these before deploying to a real
 * site; leaving them unset keeps the UI honest rather than inventing one.
 *
 * Required before deployment in India (e.g. city: "Bengaluru", "Chennai", "Delhi"):
 *   VITE_CLINIC_NAME          display name of the deploying clinic/hospital
 *   VITE_CLINIC_CITY          city (e.g. "Bengaluru")
 *   VITE_CLINIC_ADDRESS       street/postal address
 *   VITE_CLINIC_PHONE         clinic phone number
 *   VITE_CLINIC_EMERGENCY     emergency/after-hours line
 *   VITE_SUPPORT_EMAIL        patient support email
 *   VITE_PRIVACY_URL          link to the deployed privacy policy
 *   VITE_TERMS_URL            link to the deployed terms of use
 */
export interface DeploymentConfig {
  clinicName: string;
  clinicCity: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmergency: string;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  /** True only when a real clinic name has been supplied. */
  isConfigured: boolean;
}

function env(key: string): string {
  const value = (import.meta as { env?: Record<string, string> }).env?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

export const deploymentConfig: DeploymentConfig = {
  clinicName: env('VITE_CLINIC_NAME'),
  clinicCity: env('VITE_CLINIC_CITY'),
  clinicAddress: env('VITE_CLINIC_ADDRESS'),
  clinicPhone: env('VITE_CLINIC_PHONE'),
  clinicEmergency: env('VITE_CLINIC_EMERGENCY'),
  supportEmail: env('VITE_SUPPORT_EMAIL'),
  privacyUrl: env('VITE_PRIVACY_URL'),
  termsUrl: env('VITE_TERMS_URL'),
  isConfigured: env('VITE_CLINIC_NAME').length > 0,
};

/** Neutral label used wherever a clinic name would otherwise be fabricated. */
export const CLINIC_DISPLAY_NAME = deploymentConfig.isConfigured
  ? deploymentConfig.clinicName
  : 'Your clinic';

/** Neutral phone label; never a made-up number. */
export const CLINIC_PHONE_DISPLAY = deploymentConfig.isConfigured && deploymentConfig.clinicPhone
  ? deploymentConfig.clinicPhone
  : 'your clinic\u2019s number';

/** Neutral support email label. */
export const SUPPORT_EMAIL_DISPLAY = deploymentConfig.supportEmail || 'your clinic\u2019s support address';
