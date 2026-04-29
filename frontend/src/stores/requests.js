// src/stores/requests.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/composables/useApi'
import { useAuthStore } from './auth'
import { useDataMasterStore } from './dataMaster'

export const useRequestsStore = defineStore('requests', () => {
  const items    = ref([])
  const loading  = ref(false)
  const dmStore  = useDataMasterStore()

  const FALLBACK_PIPELINES = {
    engineer: ['backlog', 'in_design', 'design_done', 'in_progress_code', 'need_review_designer', 'on_review_designer', 'done_review', 'need_publish', 'done'],
    designer: ['backlog', 'in_design', 'need_review_designer', 'on_review_designer', 'done_review', 'design_finish'],
    illustrator: ['backlog', 'in_design', 'need_review_designer', 'on_review_designer', 'done_review', 'design_finish'],
    researcher: ['backlog', 'in_progress_research', 'need_review_designer', 'on_review_designer', 'done_review', 'research_finish'],
  }

  const AUDIT_PIPELINE = ['need_audit', 'on_audit', 'need_redesign', 'in_redesign', 'redesign_done', 'in_progress_code', 'need_review_designer', 'on_review_designer', 'done_review', 'need_publish', 'done']

  const DEFAULT_STATUS_ORDER = [
    'need_design_validation',
    ...AUDIT_PIPELINE,
    ...FALLBACK_PIPELINES.engineer,
    ...FALLBACK_PIPELINES.designer,
    ...FALLBACK_PIPELINES.illustrator,
    ...FALLBACK_PIPELINES.researcher,
    'need_development_update',
    'need_revision',
  ]

  function titleizeStatus(status) {
    return String(status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  function normalizeStatus(status) {
    return String(status || '')
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '_')
      .replace(/_+/g, '_')
  }

  function getRequestTypeCategory(requestType) {
    const types = dmStore.settings.requestTypes || []
    return types.find(t => t.value === requestType)?.category || null
  }

  function getConfiguredPipelines() {
    return {
      ...FALLBACK_PIPELINES,
      ...(dmStore.settings.requestPipelines || {}),
    }
  }

  // Get pipeline stages for a specific request type from requestPipelinesByType
  function getPipelineByRequestType(requestType) {
    const byType = dmStore.settings.requestPipelinesByType || {}
    if (byType[requestType] && Array.isArray(byType[requestType])) {
      return byType[requestType].map(stage => {
        if (typeof stage === 'string') {
          const normalized = normalizeStatus(stage)
          return { status: normalized, label: titleizeStatus(normalized), onFailStatus: '' }
        }
        const normalizedStatus = normalizeStatus(stage.status)
        return {
          ...stage,
          status: normalizedStatus,
          label: stage.label || titleizeStatus(normalizedStatus),
          onFailStatus: normalizeStatus(stage.onFailStatus),
        }
      })
    }
    return null
  }

  function resolvePipelineStatuses(reqOrWorkflow) {
    // If it's a request object with requestType, try to use per-type pipeline first
    if (reqOrWorkflow && typeof reqOrWorkflow === 'object' && reqOrWorkflow.requestType) {
      if (reqOrWorkflow.workflow === 'audit') return AUDIT_PIPELINE
      
      // Try per-request-type pipeline first (from requestPipelinesByType)
      const typeSpecificPipeline = getPipelineByRequestType(reqOrWorkflow.requestType)
      if (typeSpecificPipeline) {
        return typeSpecificPipeline.map(s => normalizeStatus(s.status))
      }
      
      // Fallback to category-based pipeline (legacy)
      const category = getRequestTypeCategory(reqOrWorkflow.requestType)
      const configured = getConfiguredPipelines()
      if (category && Array.isArray(configured[category]) && configured[category].length > 0) {
        return configured[category].map(normalizeStatus)
      }
      return (reqOrWorkflow.workflow === 'designer' ? configured.designer : configured.engineer).map(normalizeStatus)
    }

    if (reqOrWorkflow === 'audit') return AUDIT_PIPELINE.map(normalizeStatus)
    const configured = getConfiguredPipelines()
    return (reqOrWorkflow === 'designer' ? configured.designer : configured.engineer).map(normalizeStatus)
  }

  const ALL_STATUSES = computed(() => {
    const configured = getConfiguredPipelines()
    const dynamicStatuses = Object.values(configured).flat()
    const unique = [...new Set([...DEFAULT_STATUS_ORDER, ...dynamicStatuses])]
    return unique.map(key => ({ key, label: titleizeStatus(key) }))
  })

  function getWorkflowSteps(reqOrWorkflow) {
    if (reqOrWorkflow && typeof reqOrWorkflow === 'object' && reqOrWorkflow.requestType) {
      const typeSpecificPipeline = getPipelineByRequestType(reqOrWorkflow.requestType)
      if (Array.isArray(typeSpecificPipeline) && typeSpecificPipeline.length > 0) {
        return typeSpecificPipeline.map(stage => ({
          status: normalizeStatus(stage.status),
          label: stage.label || titleizeStatus(stage.status),
          onFailStatus: normalizeStatus(stage.onFailStatus),
        }))
      }
    }

    return resolvePipelineStatuses(reqOrWorkflow).map(status => ({
      status: normalizeStatus(status),
      label: titleizeStatus(normalizeStatus(status)),
      onFailStatus: '',
    }))
  }

  function resolveEffectiveCurrentStatus(currentStatus, reqOrWorkflow, steps) {
    const normalizedCurrentStatus = normalizeStatus(currentStatus)
    const normalizedSteps = steps.map(normalizeStatus)

    // Handle equivalent status aliases commonly found in legacy/custom data.
    const aliases = {
      published: 'done',
      completed: 'done',
    }
    const reverseAliases = {
      done: 'published',
    }

    if (normalizedSteps.includes(normalizedCurrentStatus)) {
      return normalizedCurrentStatus
    }

    const aliasMapped = normalizeStatus(aliases[normalizedCurrentStatus])
    if (aliasMapped && normalizedSteps.includes(aliasMapped)) {
      return aliasMapped
    }

    const reverseAliasMapped = normalizeStatus(reverseAliases[normalizedCurrentStatus])
    if (reverseAliasMapped && normalizedSteps.includes(reverseAliasMapped)) {
      return reverseAliasMapped
    }

    // If current status is a fallback target (onFailStatus), highlight its source step.
    if (reqOrWorkflow && typeof reqOrWorkflow === 'object' && reqOrWorkflow.requestType) {
      const typedPipeline = getPipelineByRequestType(reqOrWorkflow.requestType)
      if (Array.isArray(typedPipeline) && typedPipeline.length > 0) {
        const sourceStage = typedPipeline.find(
          stage => normalizeStatus(stage.onFailStatus) === normalizedCurrentStatus
        )
        const sourceStatus = normalizeStatus(sourceStage?.status)
        if (sourceStatus && normalizedSteps.includes(sourceStatus)) {
          return sourceStatus
        }
      }
    }

    // Legacy fallback mapping for statuses outside the visual pipeline.
    const fallbackToSource = {
      on_review_designer: 'need_review_designer',
      need_revision: 'in_progress_code',
      need_development_update: 'in_progress_code',
      need_redesign: 'in_redesign',
    }
    const mapped = normalizeStatus(fallbackToSource[normalizedCurrentStatus])
    if (mapped && normalizedSteps.includes(mapped)) {
      return mapped
    }

    return normalizedCurrentStatus
  }

  function pipeClass(stepStatus, currentStatus, reqOrWorkflow = null) {
    const normalizedCurrentStatus = normalizeStatus(currentStatus)
    const normalizedStepStatus = normalizeStatus(stepStatus)
    const steps = reqOrWorkflow ? resolvePipelineStatuses(reqOrWorkflow) : ALL_STATUSES.value.map(s => s.key)
    const normalizedSteps = steps.map(normalizeStatus)
    const effectiveCurrentStatus = resolveEffectiveCurrentStatus(currentStatus, reqOrWorkflow, steps)
    const ci = normalizedSteps.indexOf(effectiveCurrentStatus)
    const si = normalizedSteps.indexOf(normalizedStepStatus)

    const recoveryStatuses = new Set(['need_revision', 'need_development_update', 'need_redesign'])
    const isRecoveryHighlight =
      normalizedStepStatus === effectiveCurrentStatus &&
      recoveryStatuses.has(normalizedCurrentStatus) &&
      effectiveCurrentStatus !== normalizedCurrentStatus

    if (isRecoveryHighlight) return 'recovery'
    if (normalizedStepStatus === effectiveCurrentStatus) return 'active'
    if (si >= 0 && ci >= 0 && si < ci) return 'done'
    return 'pending'
  }

  function statusLabel(s) { return ALL_STATUSES.value.find(x => x.key === s)?.label || titleizeStatus(s) }

  // ── Ownership helpers ──────────────────────────────────────────────────────
  // Prefer ID match (reliable), fallback to name (for pre-migration data)
  function logBelongsToUser(log, userId, userName) {
    if (log.actorId && userId) return log.actorId === userId
    return log.actor === userName
  }

  // Maps "active/locked" status → the log action that claims ownership
  const DESIGNER_CLAIM = {
    in_design:          'start_design',
    on_review_designer: 'start_review',
    on_audit:           'start_audit',
    in_redesign:        'start_redesign',
  }

  // Returns the display name of the current designer owner (for badges)
  function getDesignerOwner(req) {
    const claimAction = DESIGNER_CLAIM[req.status]
    if (!claimAction) return null
    return (req.logs || []).find(l => l.action === claimAction)?.actor || null
  }

  // Returns true if the given user currently owns the designer slot
  function isDesignerOwner(req, userId, userName) {
    const claimAction = DESIGNER_CLAIM[req.status]
    if (!claimAction) return false
    const log = (req.logs || []).find(l => l.action === claimAction)
    if (!log) return false
    return logBelongsToUser(log, userId, userName)
  }

  // Returns the display name of the current engineer owner (for badges)
  function getEngineerOwner(req) {
    const s = req.status
    const logs = req.logs || []
    if (s === 'in_progress_code') {
      return logs.find(l => l.action === 'start_dev')?.actor || null
    }
    if (['need_revision','done_review','need_publish'].includes(s)) {
      return [...logs].reverse().find(l => ['finish_dev','submit_revision'].includes(l.action))?.actor || null
    }
    return null
  }

  // Returns true if the given user currently owns the engineer slot
  function isEngineerOwner(req, userId, userName) {
    const s = req.status
    const logs = req.logs || []
    let log = null
    if (s === 'in_progress_code') {
      log = logs.find(l => l.action === 'start_dev')
    } else if (['need_revision','done_review','need_publish'].includes(s)) {
      log = [...logs].reverse().find(l => ['finish_dev','submit_revision'].includes(l.action))
    }
    if (!log) return false
    return logBelongsToUser(log, userId, userName)
  }

  // Returns the name of the user who originally submitted the request
  function getRequesterName(req) {
    return req.requesterName || (req.logs || []).find(l => l.action === 'created')?.actor || null
  }

  // Returns the division/team of the requester
  function getRequesterTeam(req) {
    return req.requesterTeam || null
  }

  // Returns the full ownership chain with names (for display)
  function getOwnershipChain(req) {
    const logs = req.logs || []
    const find = (actions) => logs.find(l => actions.includes(l.action))?.actor || null
    return {
      requester: getRequesterName(req),
      designer:  find(['start_design', 'start_redesign']),
      engineer:  find(['start_dev']),
      reviewer:  find(['start_review']),
      auditor:   find(['start_audit']),
      publisher: find(['publish']),
    }
  }

  const FALLBACK_ACTION_TRANSITIONS = {
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
  }

  const DEFAULT_ACTION_UI = {
    approve_validation: { label:'Approve Validation', icon:'✓', primary:true, needsName:true, title:'Approve Design Validation' },
    start_design: { label:'Start Design', icon:'🎨', primary:true, needsName:true, title:'Start Design' },
    finish_design: { label:'Mark Design Done', icon:'✅', primary:true, needsName:true, autoName:true, notesLabel:'Design Completion Notes', notesPlaceholder:'Describe what was completed...', needsFigma:true, needsScreenshot:true, title:'Mark Design Done' },
    start_review: { label:'Start Review', icon:'👁', primary:true, needsName:true, title:'Start Designer Review' },
    approve_review: { label:'Approve', icon:'✓', primary:true, needsName:true, title:'Approve Implementation' },
    request_revision: { label:'Request Revision', icon:'↻', danger:true, needsName:true, notesRequired:true, notesLabel:'Revision Notes', notesPlaceholder:'Describe what needs revision...', needsScreenshot:true, title:'Request Revision' },
    start_audit: { label:'Start Audit', icon:'🔍', primary:true, needsName:true, title:'Start Audit' },
    require_redesign: { label:'Require Redesign', icon:'⚠️', danger:true, needsName:true, notesRequired:true, title:'Require Redesign' },
    audit_pass: { label:'Audit Passed', icon:'✓', primary:true, needsName:true, title:'Pass Audit' },
    start_redesign: { label:'Start Redesign', icon:'🎨', primary:true, needsName:true, title:'Start Redesign' },
    finish_redesign: { label:'Finish Redesign', icon:'✅', primary:true, needsName:true, needsFigma:true, needsScreenshot:true, title:'Finish Redesign' },
    start_dev: { label:'Start Development', icon:'⚙️', primary:true, needsName:true, title:'Start Development' },
    finish_dev: { label:'Submit for Review', icon:'📤', primary:true, needsName:true, needsScore:true, notesRequired:true, notesLabel:'Development Notes', notesPlaceholder:'Describe what was built...', needsPreviewLink:true, needsScreenshot:true, title:'Submit Development' },
    submit_revision: { label:'Submit Revision', icon:'📤', primary:true, needsName:true, notesRequired:true, notesLabel:'Revision Notes', notesPlaceholder:'What was changed...', needsPreviewLink:true, needsScreenshot:true, title:'Submit Revision' },
    publish: { label:'Publish Component', icon:'🚀', primary:true, needsName:true, needsComponentName:true, needsVersion:true, needsLibrary:true, needsDocLink:true, title:'Publish Component' },
  }

  function getActionTransition(action) {
    const configured = dmStore.settings.requestActions?.transitions || {}
    return configured[action] || FALLBACK_ACTION_TRANSITIONS[action] || null
  }

  function canExecuteAction(action, status, role) {
    const transition = getActionTransition(action)
    if (!transition) return false
    if (Array.isArray(transition.roles) && transition.roles.length > 0 && !transition.roles.includes(role)) return false
    if (Array.isArray(transition.from) && transition.from.length > 0 && !transition.from.includes(status)) return false
    return true
  }

  function makeActionDescriptor(action, overrides = {}) {
    const configuredUi = dmStore.settings.requestActions?.ui?.[action] || {}
    const transition = getActionTransition(action)
    return {
      action,
      ...(DEFAULT_ACTION_UI[action] || {}),
      ...configuredUi,
      ...(transition?.next ? { nextStatus: transition.next } : {}),
      ...overrides,
    }
  }

  // userId = auth.user?.id (preferred), userName = auth.user?.name (fallback for old data)
  function getAvailableActions(req, role, userName = null, userId = null) {
    const s = req.status
    const acts = []
    if (['designer','super_admin'].includes(role)) {
      const hasOwner = !!getDesignerOwner(req)
      const isOwner  = role === 'super_admin' || !hasOwner || isDesignerOwner(req, userId, userName)

      if (canExecuteAction('approve_validation', s, role)) acts.push(makeActionDescriptor('approve_validation'))
      if (canExecuteAction('start_design', s, role)) acts.push(makeActionDescriptor('start_design'))
      if (canExecuteAction('finish_design', s, role) && isOwner) acts.push(makeActionDescriptor('finish_design'))
      if (canExecuteAction('start_review', s, role)) acts.push(makeActionDescriptor('start_review'))
      if (canExecuteAction('approve_review', s, role) && isOwner) acts.push(makeActionDescriptor('approve_review'))
      if (canExecuteAction('request_revision', s, role) && isOwner) acts.push(makeActionDescriptor('request_revision'))
      if (canExecuteAction('start_audit', s, role)) acts.push(makeActionDescriptor('start_audit'))
      if (canExecuteAction('require_redesign', s, role) && isOwner) acts.push(makeActionDescriptor('require_redesign'))
      if (canExecuteAction('audit_pass', s, role) && isOwner) acts.push(makeActionDescriptor('audit_pass'))
      if (canExecuteAction('start_redesign', s, role)) acts.push(makeActionDescriptor('start_redesign'))
      if (canExecuteAction('finish_redesign', s, role) && isOwner) acts.push(makeActionDescriptor('finish_redesign'))
    }
    if (['engineer','super_admin'].includes(role)) {
      const hasEngOwner = !!getEngineerOwner(req)
      const isEngOwner  = role === 'super_admin' || !hasEngOwner || isEngineerOwner(req, userId, userName)

      if (canExecuteAction('start_dev', s, role)) acts.push(makeActionDescriptor('start_dev'))
      if (canExecuteAction('finish_dev', s, role) && isEngOwner) acts.push(makeActionDescriptor('finish_dev'))
      if (canExecuteAction('submit_revision', s, role) && isEngOwner) acts.push(makeActionDescriptor('submit_revision'))
      if (canExecuteAction('publish', s, role) && isEngOwner) acts.push(makeActionDescriptor('publish'))
    }
    return acts
  }

  function getGates(req) {
    const logs = req.logs || []
    const hasLog = (a) => logs.some(l => l.action === a)
    return [
      { label:'Request submitted', pass:true },
      { label:'Design completed', pass:hasLog('finish_design'), by:logs.find(l => l.action==='finish_design')?.actor },
      { label:'Development submitted', pass:hasLog('finish_dev'), by:logs.find(l => l.action==='finish_dev')?.actor },
      { label:'Designer reviewed & approved', pass:hasLog('approve_review'), by:logs.find(l => l.action==='approve_review')?.actor },
      { label:'Published', pass:hasLog('publish'), by:logs.find(l => l.action==='publish')?.actor },
    ]
  }

  // ── API calls ──────────────────────────────────────────────────────────────
  async function fetchAll() {
    loading.value = true
    try { items.value = await api.get('/requests') }
    finally { loading.value = false }
  }

  async function create(payload) {
    const r = await api.post('/requests', payload)
    items.value.unshift(r)
    return r
  }

  async function doAction(reqId, payload) {
    const r = await api.post(`/requests/${reqId}/action`, payload)
    const idx = items.value.findIndex(x => x.id === reqId)
    if (idx >= 0) items.value[idx] = r
    return r
  }

  async function override(reqId, status, note) {
    const r = await api.put(`/requests/${reqId}/override`, { status, note })
    const idx = items.value.findIndex(x => x.id === reqId)
    if (idx >= 0) items.value[idx] = r
    return r
  }

  async function triggerAudit(payload) {
    const r = await api.post('/requests/audit/trigger', payload)
    items.value.unshift(r)
    return r
  }

  const auditQueue = computed(() =>
    items.value.filter(r => ['need_audit','on_audit','need_redesign','in_redesign','redesign_done'].includes(r.status))
  )

  function myTasks(role, userName = null, userId = null) {
    return items.value.filter(req => {
      if (req.status === 'done') return false

      if (role === 'super_admin' || role === 'designer' || role === 'engineer') {
        return getAvailableActions(req, role, userName, userId).length > 0
      }

      if (role === 'developer') return req.requesterRole === 'developer'
      return false
    })
  }

  // Returns requests with status 'done' where the user participated in any log
  function myCompletedTasks(role, userName = null, userId = null) {
    return items.value.filter(req => {
      if (req.status !== 'done') return false
      if (role === 'super_admin') return true
      return (req.logs || []).some(l => logBelongsToUser(l, userId, userName))
    })
  }

  return {
    items, loading, ALL_STATUSES,
    getWorkflowSteps, pipeClass, statusLabel, getAvailableActions, getGates,
    getDesignerOwner, getEngineerOwner, isDesignerOwner, isEngineerOwner,
    getRequesterName, getRequesterTeam, getOwnershipChain,
    fetchAll, create, doAction, override, triggerAudit,
    auditQueue, myTasks, myCompletedTasks,
  }
})
