import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cognitiveApi, type CognitiveSessionRecord } from './cognitiveApi';
import { CognitiveSummary } from './CognitiveSummary';
import { EmptyState, PortalPageHeader } from '../patient/portal/ui';
import { ClipboardList } from 'lucide-react';

/** Read-only view of one recorded cognitive session from the patient's history. */
export const CognitiveSessionDetailPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [session, setSession] = useState<CognitiveSessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    cognitiveApi
      .getHistory()
      .then((result) => {
        if (cancelled) return;
        const match = result.sessions.find(
          (entry) => entry.assessmentId === assessmentId || entry.sessionId === assessmentId
        );
        if (!match) setError('This cognitive session could not be found in your records.');
        setSession(match || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'The session could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading session…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PortalPageHeader
        eyebrow="Cognitive assessment · Recorded session"
        title="Session detail"
        description="A read-only record of one cognitive assessment session, including administration conditions and descriptive task results."
        actions={
          <Link to="/patient/history" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-warm">
            <ArrowLeft className="h-4 w-4" /> Assessment history
          </Link>
        }
      />
      {!session ? (
        <EmptyState
          icon={ClipboardList}
          title="Session not available"
          detail={error || 'This session is not present in your records.'}
          action={<Link to="/patient/history" className="inline-flex min-h-11 items-center rounded-xl bg-forest px-4 text-sm font-semibold text-white">Back to history</Link>}
        />
      ) : (
        <CognitiveSummary session={session} />
      )}
    </div>
  );
};
