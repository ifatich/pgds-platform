// src/services/validators.js
// Shared validation utilities
const { getAllPipelineStatuses } = require('./requestTypeHandlers');

function normalizeStatus(status) {
  return String(status || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength (minimum 8 characters)
 */
function isValidPassword(password) {
  return password && password.length >= 8;
}

/**
 * Validate user roles
 */
const VALID_ROLES = ['super_admin', 'designer', 'engineer', 'developer'];
function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

/**
 * Validate user status
 */
const VALID_USER_STATUSES = ['active', 'inactive', 'suspended'];
function isValidUserStatus(status) {
  return VALID_USER_STATUSES.includes(status);
}

/**
 * Validate request workflow status
 */
const VALID_REQUEST_STATUSES = [
  'need_design_validation',
  'backlog',
  'in_design',
  'design_done',
  'need_review_designer',
  'on_review_designer',
  'done_review',
  'request_revision',
  'need_revision',
  'in_progress_code',
  'need_audit',
  'on_audit',
  'need_redesign',
  'in_redesign',
  'redesign_done',
  'need_development_update',
  'need_publish',
  'done',
];
function isValidRequestStatus(status) {
  const normalizedStatus = normalizeStatus(status);

  if (VALID_REQUEST_STATUSES.includes(normalizedStatus)) {
    return true;
  }

  // Allow status values configured dynamically in data master pipelines.
  return getAllPipelineStatuses().includes(normalizedStatus);
}

/**
 * Validate research request status
 */
const VALID_RESEARCH_STATUSES = ['submitted', 'in_progress', 'completed', 'on_hold'];
function isValidResearchStatus(status) {
  return VALID_RESEARCH_STATUSES.includes(status);
}

/**
 * Validate timeline quarter
 */
const VALID_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
function isValidQuarter(quarter) {
  return VALID_QUARTERS.includes(quarter);
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidRole,
  isValidUserStatus,
  isValidRequestStatus,
  isValidResearchStatus,
  isValidQuarter,
  VALID_ROLES,
  VALID_USER_STATUSES,
  VALID_REQUEST_STATUSES,
  VALID_RESEARCH_STATUSES,
  VALID_QUARTERS,
};
