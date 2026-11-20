import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users
} from 'lucide-react';
import { doctorApi, type DoctorDashboardStats } from '../../../services/portalApi';
import { useAuthStore } from '../../../store/authStore';
import { useDoctorPortalStore } from '../../../store/doctorPortalStore';
import {
  Card,
  ChangePill,
  DoctorPageHeader,
  ReviewPill,
  ReviewStatePill,
  StatCard,
  formatDate,
  formatDateTime,
  primaryButton,
  secondaryButton
} from './ui';

export const DoctorPortalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, registeredPatients, appointments, changeAcknowledgements, notes } = useDoctorPortalStore();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    doctorApi
      .getDashboard()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Live dashboard unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = appointments
    .filter((appointment) => appointment.status === 'UPCOMING')
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  const acknowledgedIds = changeAcknowledgements.map((item) => item.patientId);
  const openChangeAlerts = (stats?.changeReviewQueue || []).filter((item) => !acknowledgedIds.includes(item.patientId));
  const pendingReviewCount = (stats?.pendingReviews || 0) + registeredPatients.length * 0;
  const totalPatients = (stats?.totalPatients || 0) + registeredPatients.length;
  const recentNotes = notes.slice(0, 3);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/doctor/patients${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
  };

  return (
    <div className="space-y-6">
      <DoctorPageHeader
        screen="Screen 49 · Doctor dashboard"
        title={`Good morning, ${(user?.name || profile.fullName || 'Doctor').replace(/^Dr\.?\s*/i, 'Dr. ')}`}
        description="A review-first view of your panel, new screening activity, and within-person changes that may benefit from clinical attention."
        actions={
          <>
            <Link to="/doctor/patients/new" className={primaryButton}>
              <UserPlus className="h-4 w-4" /> Add patient
            </Link>
            <Link to="/doctor/patients?select=true" className={secondaryButton}>
              <Sparkles className="h-4 w-4" /> Start screening
            </Link>
          </>
        }
      />

      <form onSubmit={handleSearch} className="relative rounded-2xl border border-line bg-white p-2 shadow-card">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Quick search by patient name or hospital ID…"
          className="w-full rounded-xl border-0 bg-warm py-3 pl-11 pr-24 text-[14px] text-slate-800 outline-none placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          aria-label="Quick patient search"
        />
        <button type="submit" className={`${primaryButton} absolute right-3 top-1/2 -translate-y-1/2`}>
          Search
        </button>
      </form>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
          Live hospital metrics could not be reached ({loadError}). Locally registered patients and workflow items are still available.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total patients" value={loading ? '—' : String(totalPatients)} detail={`${registeredPatients.length} registered here`} icon={Users} />
        <StatCard label="Requiring review" value={loading ? '—' : String(pendingReviewCount)} detail="Pending clinical sign-off" icon={ClipboardList} tone="amber" />
        <StatCard label="New assessments" value={loading ? '—' : String(stats?.assessmentsToday || 0)} detail={`${stats?.completedAssessments || 0} completed in the record`} icon={Activity} tone="blue" />
        <StatCard label="Upcoming follow-ups" value={String(upcoming.length)} detail={upcoming[0] ? `Next ${formatDate(upcoming[0].date)}` : 'None scheduled'} icon={CalendarClock} tone="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Recent assessment activity</h2>
              <p className="mt-0.5 text-xs text-muted">Latest completed screening sessions across your panel.</p>
            </div>
            <Link to="/doctor/patients" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="p-6 text-center text-xs text-muted">Loading assessment activity…</p>
          ) : (stats?.recentAssessments || []).length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-body">No completed assessments yet</p>
              <p className="mt-1 text-xs text-muted">Completed screening sessions will appear here for review.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {(stats?.recentAssessments || []).slice(0, 5).map((assessment) => (
                <li key={assessment.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link to={`/doctor/patients/${assessment.patientId}`} className="text-[14px] font-semibold text-ink hover:text-blue-700">
                      {assessment.patientName}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {assessment.patientId} · {formatDate(assessment.date)} · {assessment.assessmentType || 'Full screening'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-warm px-2 py-1 text-xs font-bold text-body">
                      {assessment.score === null ? 'Not interpretable' : `${Math.round(assessment.score)} / 100`}
                    </span>
                    <ReviewStatePill state={assessment.reviewState} />
                    <ReviewPill status={assessment.reviewStatus} />
                    <Link to={`/doctor/patients/${assessment.patientId}/review?assessment=${assessment.id}`} className="rounded-lg p-1.5 text-muted hover:bg-warm hover:text-body" aria-label={`Review assessment for ${assessment.patientName}`}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Change alerts
              </h2>
              <p className="mt-0.5 text-xs text-muted">Within-person signals needing acknowledgement.</p>
            </div>
            <Link to="/doctor/change-detection" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
              Queue
            </Link>
          </div>

          {openChangeAlerts.length === 0 ? (
            <div className="p-7 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
              <p className="mt-2 text-xs font-semibold text-body">No open change alerts</p>
              <p className="mt-1 text-xs leading-4 text-muted">Acknowledged or insufficient-comparison patients are excluded.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {openChangeAlerts.slice(0, 4).map((alert) => (
                <li key={alert.patientId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/doctor/patients/${alert.patientId}/change-detection`} className="text-[14px] font-semibold text-ink hover:text-blue-700">
                        {alert.patientName}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{formatDate(alert.latestAssessmentDate)} · {alert.reviewReasons.length} review cue{alert.reviewReasons.length === 1 ? '' : 's'}</p>
                    </div>
                    <ChangePill status="REVIEW" />
                  </div>
                  <p className="mt-1.5 text-xs leading-4 text-body">
                    {alert.reviewReasons.includes('OUTSIDE_RELIABLE_CHANGE') && 'Score decline beyond measured variability. '}
                    {alert.reviewReasons.includes('FUNCTIONAL_CHANGE') && 'Reported daily-function change. '}
                    {alert.reviewReasons.includes('CONTEXT_CHANGE') && 'Health-context contributors changed.'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Upcoming follow-ups</h2>
              <p className="mt-0.5 text-xs text-muted">Appointments and repeat assessment reminders.</p>
            </div>
            <Link to="/doctor/appointments" className="text-xs font-semibold text-blue-700 hover:text-blue-900">Manage</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-7 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-body">Nothing scheduled</p>
              <Link to="/doctor/appointments" className={`${secondaryButton} mt-3`}>
                <Plus className="h-3.5 w-3.5" /> Schedule follow-up
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.slice(0, 4).map((appointment) => (
                <li key={appointment.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{appointment.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {appointment.date} at {appointment.time} · {appointment.location}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-800">
                    {appointment.type.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Recent clinical notes</h2>
              <p className="mt-0.5 text-xs text-muted">Your latest observations and review decisions.</p>
            </div>
            <Link to="/doctor/patients" className="text-xs font-semibold text-blue-700 hover:text-blue-900">Open records</Link>
          </div>
          {recentNotes.length === 0 ? (
            <div className="p-7 text-center">
              <Clock3 className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-body">No notes yet</p>
              <p className="mt-1 text-xs text-muted">Clinical notes are saved per patient review.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recentNotes.map((note) => {
                const patient = registeredPatients.find((item) => item.patientId === note.patientId);
                return (
                  <li key={note.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/doctor/patients/${note.patientId}/notes`} className="text-[14px] font-semibold text-ink hover:text-blue-700">
                          {patient?.name || note.patientId}
                        </Link>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted">{note.observations}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-muted">{formatDateTime(note.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/doctor/patients/new" className="group rounded-2xl border border-line bg-white p-4 transition hover:border-blue-300 hover:shadow-card">
          <UserPlus className="h-5 w-5 text-blue-700" />
          <p className="mt-2 text-[14px] font-semibold text-ink">Register a patient</p>
          <p className="mt-0.5 text-xs leading-4 text-muted">Create a hospital ID, capture consent, and send an invitation.</p>
        </Link>
        <Link to="/doctor/reports" className="group rounded-2xl border border-line bg-white p-4 transition hover:border-blue-300 hover:shadow-card">
          <FileText className="h-5 w-5 text-blue-700" />
          <p className="mt-2 text-[14px] font-semibold text-ink">Clinical reports</p>
          <p className="mt-0.5 text-xs leading-4 text-muted">Review printable patient and longitudinal summaries.</p>
        </Link>
        <Link to="/doctor/longitudinal" className="group rounded-2xl border border-line bg-white p-4 transition hover:border-blue-300 hover:shadow-card">
          <TrendingUp className="h-5 w-5 text-blue-700" />
          <p className="mt-2 text-[14px] font-semibold text-ink">Longitudinal trends</p>
          <p className="mt-0.5 text-xs leading-4 text-muted">Compare cognitive, ocular, vocal, and functional changes.</p>
        </Link>
      </div>
    </div>
  );
};
