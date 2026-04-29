const { getDb } = require('../data/db');

const FALLBACK_STATE_MACHINE = {
  approve_validation: { from: ['need_design_validation'], next: 'backlog', roles: ['designer', 'super_admin'] },
  start_design: { from: ['backlog'], next: 'in_design', roles: ['designer', 'super_admin'] },
  finish_design: { from: ['in_design'], next: 'design_done', roles: ['designer', 'super_admin'] },
  start_review: { from: ['need_review_designer'], next: 'on_review_designer', roles: ['designer', 'super_admin'] },
  approve_review: { from: ['on_review_designer'], next: 'done_review', roles: ['designer', 'super_admin'] },
  request_revision: { from: ['on_review_designer'], next: 'need_revision', roles: ['designer', 'super_admin'] },
  start_audit: { from: ['need_audit'], next: 'on_audit', roles: ['designer', 'super_admin'] },
  require_redesign: { from: ['on_audit'], next: 'need_redesign', roles: ['designer', 'super_admin'] },
  audit_pass: { from: ['on_audit'], next: 'need_development_update', roles: ['designer', 'super_admin'] },
  start_redesign: { from: ['need_redesign'], next: 'in_redesign', roles: ['designer', 'super_admin'] },
  finish_redesign: { from: ['in_redesign'], next: 'redesign_done', roles: ['designer', 'super_admin'] },
  start_dev: { from: ['design_done', 'redesign_done', 'need_development_update'], next: 'in_progress_code', roles: ['engineer', 'super_admin'] },
  finish_dev: { from: ['in_progress_code'], next: 'need_review_designer', roles: ['engineer', 'super_admin'] },
  submit_revision: { from: ['need_revision'], next: 'need_review_designer', roles: ['engineer', 'super_admin'] },
  publish: { from: ['done_review', 'need_publish'], next: 'done', roles: ['engineer', 'super_admin'] },
};

const FALLBACK_ACTION_UI = {
  approve_validation: {
    label: 'Approve Validation',
    icon: '✓',
    title: 'Approve Design Validation',
    primary: true,
    needsName: true,
    logIcon: '✅',
    dotClass: 'approved',
  },
  start_design: {
    label: 'Start Design',
    icon: '🎨',
    title: 'Start Design',
    primary: true,
    needsName: true,
    logIcon: '🎨',
    dotClass: 'info',
  },
  finish_design: {
    label: 'Mark Design Done',
    icon: '✅',
    title: 'Mark Design Done',
    primary: true,
    needsName: true,
    autoName: true,
    needsFigma: true,
    needsScreenshot: true,
    notesLabel: 'Design Completion Notes',
    notesPlaceholder: 'Describe what was completed...',
    logIcon: '✅',
    dotClass: 'approved',
  },
  start_review: {
    label: 'Start Review',
    icon: '👁',
    title: 'Start Designer Review',
    primary: true,
    needsName: true,
    logIcon: '🔄',
    dotClass: 'info',
  },
  approve_review: {
    label: 'Approve',
    icon: '✓',
    title: 'Approve Implementation',
    primary: true,
    needsName: true,
    logIcon: '✅',
    dotClass: 'approved',
  },
  request_revision: {
    label: 'Request Revision',
    icon: '↻',
    title: 'Request Revision',
    danger: true,
    needsName: true,
    notesRequired: true,
    notesLabel: 'Revision Notes',
    notesPlaceholder: 'Describe what needs revision...',
    needsScreenshot: true,
    logIcon: '↻',
    dotClass: 'revision',
  },
  start_audit: {
    label: 'Start Audit',
    icon: '🔍',
    title: 'Start Audit',
    primary: true,
    needsName: true,
    logIcon: '🔍',
    dotClass: 'info',
  },
  require_redesign: {
    label: 'Require Redesign',
    icon: '⚠️',
    title: 'Require Redesign',
    danger: true,
    needsName: true,
    notesRequired: true,
    logIcon: '🔄',
    dotClass: 'revision',
  },
  audit_pass: {
    label: 'Audit Passed',
    icon: '✓',
    title: 'Pass Audit',
    primary: true,
    needsName: true,
    logIcon: '✅',
    dotClass: 'approved',
  },
  start_redesign: {
    label: 'Start Redesign',
    icon: '🎨',
    title: 'Start Redesign',
    primary: true,
    needsName: true,
    logIcon: '🎨',
    dotClass: 'info',
  },
  finish_redesign: {
    label: 'Finish Redesign',
    icon: '✅',
    title: 'Finish Redesign',
    primary: true,
    needsName: true,
    needsFigma: true,
    needsScreenshot: true,
    logIcon: '✅',
    dotClass: 'approved',
  },
  start_dev: {
    label: 'Start Development',
    icon: '⚙️',
    title: 'Start Development',
    primary: true,
    needsName: true,
    logIcon: '⚙️',
    dotClass: 'info',
  },
  finish_dev: {
    label: 'Submit for Review',
    icon: '📤',
    title: 'Submit Development',
    primary: true,
    needsName: true,
    needsScore: true,
    notesRequired: true,
    notesLabel: 'Development Notes',
    notesPlaceholder: 'Describe what was built...',
    needsPreviewLink: true,
    needsScreenshot: true,
    logIcon: '✅',
    dotClass: 'approved',
  },
  submit_revision: {
    label: 'Submit Revision',
    icon: '📤',
    title: 'Submit Revision',
    primary: true,
    needsName: true,
    notesRequired: true,
    notesLabel: 'Revision Notes',
    notesPlaceholder: 'What was changed...',
    needsPreviewLink: true,
    needsScreenshot: true,
    logIcon: '📤',
    dotClass: 'info',
  },
  publish: {
    label: 'Publish Component',
    icon: '🚀',
    title: 'Publish Component',
    primary: true,
    needsName: true,
    needsComponentName: true,
    needsVersion: true,
    needsLibrary: true,
    needsDocLink: true,
    logIcon: '🚀',
    dotClass: 'done',
  },
};

function readSettings() {
  try {
    const row = getDb().prepare("SELECT settings FROM data_master WHERE id='singleton'").get();
    return row?.settings ? JSON.parse(row.settings) : null;
  } catch (error) {
    console.warn('workflowConfig: failed reading data master:', error.message);
    return null;
  }
}

function getRequestActionsConfig() {
  const settings = readSettings();
  const configured = settings?.requestActions;

  return {
    transitions: {
      ...FALLBACK_STATE_MACHINE,
      ...(configured?.transitions || {}),
    },
    ui: {
      ...FALLBACK_ACTION_UI,
      ...(configured?.ui || {}),
    },
  };
}

module.exports = {
  FALLBACK_STATE_MACHINE,
  FALLBACK_ACTION_UI,
  getRequestActionsConfig,
};