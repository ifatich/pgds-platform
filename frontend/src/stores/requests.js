// src/stores/requests.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/composables/useApi'
import { useAuthStore } from './auth'

export const useRequestsStore = defineStore('requests', () => {
  const items    = ref([])
  const loading  = ref(false)

  // Workflow definitions
  const WF_DEVELOPER = [
    { label:'Backlog', status:'backlog' }, { label:'In Design', status:'in_design' },
    { label:'Design Done', status:'design_done' }, { label:'In Progress', status:'in_progress_code' },
    { label:'Need Review', status:'need_review_designer' }, { label:'On Review', status:'on_review_designer' },
    { label:'Done Review', status:'done_review' }, { label:'Need Publish', status:'need_publish' }, { label:'Done', status:'done' },
  ]
  const WF_DESIGNER = [
    { label:'Need Validation', status:'need_design_validation' }, { label:'Backlog', status:'backlog' },
    { label:'In Design', status:'in_design' }, { label:'Design Done', status:'design_done' },
    { label:'In Progress', status:'in_progress_code' }, { label:'Need Review', status:'need_review_designer' },
    { label:'On Review', status:'on_review_designer' }, { label:'Done Review', status:'done_review' },
    { label:'Need Publish', status:'need_publish' }, { label:'Done', status:'done' },
  ]
  const WF_AUDIT = [
    { label:'Need Audit', status:'need_audit' }, { label:'On Audit', status:'on_audit' },
    { label:'Need Redesign', status:'need_redesign' }, { label:'In Redesign', status:'in_redesign' },
    { label:'Redesign Done', status:'redesign_done' }, { label:'In Progress', status:'in_progress_code' },
    { label:'Need Review', status:'need_review_designer' }, { label:'On Review', status:'on_review_designer' },
    { label:'Done Review', status:'done_review' }, { label:'Need Publish', status:'need_publish' }, { label:'Done', status:'done' },
  ]

  const ALL_STATUSES = [
    { key:'backlog', label:'Backlog' }, { key:'need_design_validation', label:'Need Validation' },
    { key:'in_design', label:'In Design' }, { key:'design_done', label:'Design Done' },
    { key:'in_progress_code', label:'In Progress Code' }, { key:'need_review_designer', label:'Need Review' },
    { key:'on_review_designer', label:'On Review' }, { key:'need_revision', label:'Need Revision' },
    { key:'done_review', label:'Done Review' }, { key:'need_publish', label:'Need Publish' },
    { key:'done', label:'Done' }, { key:'need_audit', label:'Need Audit' },
    { key:'on_audit', label:'On Audit' }, { key:'need_redesign', label:'Need Redesign' },
    { key:'in_redesign', label:'In Redesign' }, { key:'redesign_done', label:'Redesign Done' },
    { key:'need_development_update', label:'Need Dev Update' },
  ]

  function getWorkflowSteps(wf) {
    return wf === 'designer' ? WF_DESIGNER : wf === 'audit' ? WF_AUDIT : WF_DEVELOPER
  }

  function pipeClass(stepStatus, currentStatus) {
    const steps = ALL_STATUSES.map(s => s.key)
    const ci = steps.indexOf(currentStatus)
    const si = steps.indexOf(stepStatus)
    if (stepStatus === currentStatus) return 'active'
    if (si < ci) return 'done'
    return 'pending'
  }

  function statusLabel(s) { return ALL_STATUSES.find(x => x.key === s)?.label || s }

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

  // userId = auth.user?.id (preferred), userName = auth.user?.name (fallback for old data)
  function getAvailableActions(req, role, userName = null, userId = null) {
    const s = req.status
    const acts = []
    if (['designer','super_admin'].includes(role)) {
      const hasOwner = !!getDesignerOwner(req)
      const isOwner  = role === 'super_admin' || !hasOwner || isDesignerOwner(req, userId, userName)

      if (s === 'need_design_validation') acts.push({ action:'approve_validation', label:'Approve Validation', icon:'✓', primary:true, nextStatus:'backlog', needsName:true, title:'Approve Design Validation' })
      if (s === 'backlog') acts.push({ action:'start_design', label:'Start Design', icon:'🎨', primary:true, nextStatus:'in_design', needsName:true, title:'Start Design' })
      if (s === 'in_design' && isOwner) acts.push({ action:'finish_design', label:'Mark Design Done', icon:'✅', primary:true, nextStatus:'design_done', needsName:true, autoName:true, notesLabel:'Design Completion Notes', notesPlaceholder:'Describe what was completed...', needsFigma:true, needsScreenshot:true, title:'Mark Design Done' })
      if (s === 'need_review_designer') acts.push({ action:'start_review', label:'Start Review', icon:'👁', primary:true, nextStatus:'on_review_designer', needsName:true, title:'Start Designer Review' })
      if (s === 'on_review_designer' && isOwner) {
        acts.push({ action:'approve_review', label:'Approve', icon:'✓', primary:true, nextStatus:'done_review', needsName:true, title:'Approve Implementation' })
        acts.push({ action:'request_revision', label:'Request Revision', icon:'↻', danger:true, nextStatus:'need_revision', needsName:true, notesRequired:true, notesLabel:'Revision Notes', notesPlaceholder:'Describe what needs revision...', needsScreenshot:true, title:'Request Revision' })
      }
      if (s === 'need_audit') acts.push({ action:'start_audit', label:'Start Audit', icon:'🔍', primary:true, nextStatus:'on_audit', needsName:true, title:'Start Audit' })
      if (s === 'on_audit' && isOwner) {
        acts.push({ action:'require_redesign', label:'Require Redesign', icon:'⚠️', danger:true, nextStatus:'need_redesign', needsName:true, notesRequired:true, title:'Require Redesign' })
        acts.push({ action:'audit_pass', label:'Audit Passed', icon:'✓', primary:true, nextStatus:'need_development_update', needsName:true, title:'Pass Audit' })
      }
      if (s === 'need_redesign') acts.push({ action:'start_redesign', label:'Start Redesign', icon:'🎨', primary:true, nextStatus:'in_redesign', needsName:true, title:'Start Redesign' })
      if (s === 'in_redesign' && isOwner) acts.push({ action:'finish_redesign', label:'Finish Redesign', icon:'✅', primary:true, nextStatus:'redesign_done', needsName:true, needsFigma:true, needsScreenshot:true, title:'Finish Redesign' })
    }
    if (['engineer','super_admin'].includes(role)) {
      const hasEngOwner = !!getEngineerOwner(req)
      const isEngOwner  = role === 'super_admin' || !hasEngOwner || isEngineerOwner(req, userId, userName)

      if (['design_done','redesign_done','need_development_update'].includes(s)) acts.push({ action:'start_dev', label:'Start Development', icon:'⚙️', primary:true, nextStatus:'in_progress_code', needsName:true, title:'Start Development' })
      if (s === 'in_progress_code' && isEngOwner) acts.push({ action:'finish_dev', label:'Submit for Review', icon:'📤', primary:true, nextStatus:'need_review_designer', needsName:true, needsScore:true, notesRequired:true, notesLabel:'Development Notes', notesPlaceholder:'Describe what was built...', needsPreviewLink:true, needsScreenshot:true, title:'Submit Development' })
      if (s === 'need_revision'  && isEngOwner) acts.push({ action:'submit_revision', label:'Submit Revision', icon:'📤', primary:true, nextStatus:'need_review_designer', needsName:true, notesRequired:true, notesLabel:'Revision Notes', notesPlaceholder:'What was changed...', needsPreviewLink:true, needsScreenshot:true, title:'Submit Revision' })
      if (['done_review','need_publish'].includes(s) && isEngOwner) acts.push({ action:'publish', label:'Publish Component', icon:'🚀', primary:true, nextStatus:'done', needsName:true, needsComponentName:true, needsVersion:true, needsLibrary:true, needsDocLink:true, title:'Publish Component' })
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
    // Designer statuses
    const OPEN_DESIGNER   = ['backlog','need_design_validation','need_review_designer','need_audit','need_redesign']
    const ACTIVE_DESIGNER = ['in_design','on_review_designer','on_audit','in_redesign']
    // Engineer statuses
    const OPEN_ENGINEER   = ['design_done','redesign_done','need_development_update']
    const ACTIVE_ENGINEER = ['in_progress_code','need_revision','done_review','need_publish']

    return items.value.filter(req => {
      if (role === 'super_admin' &&
        [...OPEN_DESIGNER, ...ACTIVE_DESIGNER, ...OPEN_ENGINEER, ...ACTIVE_ENGINEER].includes(req.status)) return true
      if (role === 'designer') {
        if (OPEN_DESIGNER.includes(req.status)) return true
        if (ACTIVE_DESIGNER.includes(req.status)) {
          const hasOwner = !!getDesignerOwner(req)
          return !hasOwner || isDesignerOwner(req, userId, userName)
        }
        return false
      }
      if (role === 'engineer') {
        if (OPEN_ENGINEER.includes(req.status)) return true
        if (ACTIVE_ENGINEER.includes(req.status)) {
          const hasOwner = !!getEngineerOwner(req)
          return !hasOwner || isEngineerOwner(req, userId, userName)
        }
        return false
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
