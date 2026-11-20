/**
 * Signal-quality checking for camera-based eye measurements.
 *
 * A normal webcam is sensitive to light, distance, glasses and head movement.
 * Rather than silently reporting numbers from a bad recording, we score the
 * session and tell the person (and later the clinician) when the recording is
 * not usable. This is a *usability* judgement, not a clinical threshold.
 */

export type QualityLevel = 'good' | 'fair' | 'poor';

export type QualityReason =
  | 'FACE_NOT_VISIBLE'
  | 'LOW_LIGHT'
  | 'BRIGHT_GLARE'
  | 'TOO_FAR'
  | 'TOO_CLOSE'
  | 'HEAD_MOVEMENT';

export interface SignalQualityInput {
  /** Fraction of samples where a face was tracked, 0..1. */
  facePresenceRatio: number;
  /** Mean luma of the camera frame, 0..255. Null when unavailable. */
  meanLuminance: number | null;
  /** Interocular distance in pixels, used as a distance proxy. */
  interocularPx: number;
  /** Mean head stability reported by the tracker, 0..100. */
  headStability: number;
}

export interface SignalQuality {
  score: number;
  level: QualityLevel;
  reasons: QualityReason[];
  /** Whether the session should be compared with earlier sessions. */
  comparable: boolean;
  summary: string;
}

const REASON_COPY: Record<QualityReason, string> = {
  FACE_NOT_VISIBLE: 'Your face was not visible for part of the activity.',
  LOW_LIGHT: 'The room was too dark for reliable tracking.',
  BRIGHT_GLARE: 'Bright light or glare washed out the image.',
  TOO_FAR: 'You were too far from the camera.',
  TOO_CLOSE: 'You were very close to the camera.',
  HEAD_MOVEMENT: 'There was a lot of head movement.',
};

const REASON_COPY_TA: Record<QualityReason, string> = {
  FACE_NOT_VISIBLE: 'பயிற்சியின் போது உங்கள் முகம் தெளிவாகத் தெரியவில்லை.',
  LOW_LIGHT: 'சரியான கண்காணிப்பிற்கு அறையில் போதிய வெளிச்சம் இல்லை.',
  BRIGHT_GLARE: 'அதிக வெளிச்சம் அல்லது ஒளி பிரதிபலிப்பு கேமராவை மங்கலாக்கியது.',
  TOO_FAR: 'நீங்கள் கேமராவிலிருந்து அதிக தூரத்தில் இருந்தீர்கள்.',
  TOO_CLOSE: 'நீங்கள் கேமராவிற்கு மிக அருகில் இருந்தீர்கள்.',
  HEAD_MOVEMENT: 'தலையின் அசைவு அதிகமாக இருந்தது.',
};

const REASON_COPY_HI: Record<QualityReason, string> = {
  FACE_NOT_VISIBLE: 'गतिविधि के दौरान आपका चेहरा स्पष्ट रूप से नहीं दिखा।',
  LOW_LIGHT: 'सटीक ट्रैकिंग के लिए कमरे में पर्याप्त रोशनी नहीं थी।',
  BRIGHT_GLARE: 'तेज रोशनी या चमक के कारण कैमरा छवि धुंधली हो गई।',
  TOO_FAR: 'आप कैमरे से बहुत दूर थे।',
  TOO_CLOSE: 'आप कैमरे के बहुत करीब थे।',
  HEAD_MOVEMENT: 'सिर की हलचल अधिक थी।',
};

/** Feedback shown to the participant, in the language the session is running in. */
export const qualityReasonText = (reason: QualityReason, language?: string): string => {
  if (language === 'ta') return REASON_COPY_TA[reason] ?? REASON_COPY[reason];
  if (language === 'hi') return REASON_COPY_HI[reason] ?? REASON_COPY[reason];
  return REASON_COPY[reason];
};

export const assessSignalQuality = (input: SignalQualityInput): SignalQuality => {
  const reasons: QualityReason[] = [];
  let score = 0;

  const face = Math.max(0, Math.min(1, input.facePresenceRatio));
  score += face * 40;
  if (face < 0.6) reasons.push('FACE_NOT_VISIBLE');

  if (input.meanLuminance === null) {
    // No frame sampling available: give the benefit of the doubt rather than
    // claiming a lighting problem we did not measure.
    score += 15;
  } else {
    const luma = input.meanLuminance;
    if (luma < 55) {
      reasons.push('LOW_LIGHT');
      score += 0;
    } else if (luma > 215) {
      reasons.push('BRIGHT_GLARE');
      score += 5;
    } else if (luma < 80 || luma > 190) {
      score += 15;
    } else {
      score += 25;
    }
  }

  if (input.interocularPx < 32) {
    reasons.push('TOO_FAR');
    score += 0;
  } else if (input.interocularPx > 260) {
    reasons.push('TOO_CLOSE');
    score += 5;
  } else {
    score += 20;
  }

  const stability = Math.max(0, Math.min(100, input.headStability));
  score += (stability / 100) * 15;
  if (stability < 35) reasons.push('HEAD_MOVEMENT');

  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  const level: QualityLevel = rounded >= 75 ? 'good' : rounded >= 50 ? 'fair' : 'poor';

  // Comparable requires enough visible-face samples and a non-poor score.
  // A poor session must never be compared as if it were a valid measurement.
  const comparable = face >= 0.6 && rounded >= 50;

  return {
    score: rounded,
    level,
    reasons,
    comparable,
    summary: comparable
      ? level === 'good'
        ? 'Tracking quality was good.'
        : 'Tracking quality was fair; results are usable with care.'
      : 'Tracking quality was too low for a reliable result. Please try again.',
  };
};
