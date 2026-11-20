import type { SupportedLanguage } from './types';
import { en } from './dashboardCopy.en';
import { ar } from './dashboardCopy.ar';

export interface DashboardCopy {
  header: {
    eyebrow: string;
    greeting: (name: string) => string;
    description: string;
    startAssessment: string;
  };
  hero: {
    baselineActive: string;
    baselineMissing: string;
    established: (date: string) => string;
    latestTitle: string;
    firstTitle: string;
    latestAwaiting: (date: string) => string;
    latestReviewed: (date: string) => string;
    firstBody: string;
    readLatest: string;
    beginAssessment: string;
    seeCarePlan: string;
    sceneTitle: string;
    duration: string;
    durationValue: string;
    careTeam: string;
    nextVisit: string;
    notScheduled: string;
    monitoring: string;
    careTeamFallback: string;
    reviewSuggested: string;
    moreDataNeeded: string;
    monitoringOnly: string;
  };
  followUp: {
    title: string;
    detail: string;
    link: string;
    fallbackType: string;
    scheduled: string;
    note: string;
    emptyTitle: string;
    emptyDetail: string;
    emptyAction: string;
  };
  timeline: {
    title: string;
    detail: string;
    open: string;
    itemNote: string;
    emptyTitle: string;
    emptyDetail: string;
    emptyAction: string;
  };
  stats: {
    latestAssessment: string;
    notStarted: string;
    beginSession: string;
    personalBaseline: string;
    established: string;
    pending: string;
    provisional: string;
    requiresFirst: string;
    monitoring: string;
    review: string;
    stable: string;
    building: string;
    lastChecked: (date: string) => string;
    moreSessions: string;
    unread: string;
    fromCareTeam: string;
    upToDate: string;
  };
  baseline: {
    dial: string;
    title: string;
    detail: string;
    view: string;
    loading: string;
    loadingDetail: string;
    errorTitle: string;
    errorBody: string;
    provisional: string;
    provisionalNote: string;
    emptyTitle: string;
    emptyDetail: string;
    start: string;
    metrics: string[];
  };
  recent: {
    title: string;
    detail: string;
    all: string;
    itemNote: string;
    reviewed: string;
    availableAfterReview: string;
    emptyTitle: string;
    emptyDetail: string;
  };
  context: {
    title: string;
    detail: string;
    review: string;
    sleep: string;
    sleepValue: (hours: number, quality: number) => string;
    activity: string;
    activityValue: (steps: string, minutes: number) => string;
    wellbeing: string;
    wellbeingValue: (mood: number, stress: number) => string;
    empty: string;
    linked: (count: number, date: string) => string;
  };
  careTeam: {
    title: string;
    detail: string;
    notAssigned: string;
    nextReview: string;
    viewAppointments: string;
  };
  disclaimer: {
    pill: string;
    title: string;
    body: string;
    link: string;
  };
}

export const getDashboardCopy = (language: SupportedLanguage): DashboardCopy =>
  language === 'ar' ? ar : en;
