// frontend/src/stores/research.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { useDataMasterStore } from './dataMaster';

export const useResearchStore = defineStore('research', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const dmStore = useDataMasterStore();

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const fallbackStatuses = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'on_hold', label: 'On Hold' },
  ];

  const workflowSteps = [
    { status: 'submitted', label: 'Submitted' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'completed', label: 'Completed' },
  ];

  const helpCategories = [
    'Design & Wireframing',
    'User Research',
    'Usability Testing',
    'UI/UX Audit',
    'Visual Identity',
    'Interaction Design',
    'Other',
  ];

  function titleizeStatus(status) {
    return String(status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  function normalizeStatus(status) {
    return String(status || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  function inferResearchTypeKey(request = null) {
    if (!request || typeof request !== 'object') return 'research'

    const requestTypes = dmStore.settings.requestTypes || []
    const candidates = [request.requestType, request.whatWeHelp]
      .filter(Boolean)
      .map(normalizeStatus)
      .filter(Boolean)

    // 1) Exact match against request type value
    for (const candidate of candidates) {
      const exactValue = requestTypes.find(t => normalizeStatus(t.value) === candidate)
      if (exactValue?.value) return normalizeStatus(exactValue.value)
    }

    // 2) Exact match against request type label
    for (const candidate of candidates) {
      const exactLabel = requestTypes.find(t => normalizeStatus(t.label) === candidate)
      if (exactLabel?.value) return normalizeStatus(exactLabel.value)
    }

    // 3) Fuzzy contains match against label (for legacy/free-text values)
    for (const candidate of candidates) {
      const fuzzy = requestTypes.find(t => {
        const labelKey = normalizeStatus(t.label)
        return labelKey.includes(candidate) || candidate.includes(labelKey)
      })
      if (fuzzy?.value) return normalizeStatus(fuzzy.value)
    }

    // 4) Fallback to normalized source key
    if (candidates.length > 0) return candidates[0]
    return 'research'
  }

  function resolveEffectiveCurrentStatus(currentStatus, order) {
    const normalizedCurrent = normalizeStatus(currentStatus)
    if (order.includes(normalizedCurrent)) return normalizedCurrent

    // Map legacy research statuses to configured pipeline positions.
    if (normalizedCurrent === 'submitted' && order.length > 0) {
      return order[0]
    }
    if (normalizedCurrent === 'in_progress' && order.length > 1) {
      return order[1]
    }
    if (normalizedCurrent === 'completed' && order.length > 0) {
      return order[order.length - 1]
    }
    if (normalizedCurrent === 'on_hold' && order.length > 1) {
      return order[1]
    }

    return normalizedCurrent
  }

  // Get configured research pipeline from Data Master, or use hardcoded default
  function getResearchPipeline(request = null) {
    const byType = dmStore.settings.requestPipelinesByType || {}
    const typeKey = inferResearchTypeKey(request)

    if (byType[typeKey] && Array.isArray(byType[typeKey])) {
      return byType[typeKey].map(stage => {
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
    
    // Check if there's a generic 'research' pipeline config  
    if (byType.research && Array.isArray(byType.research)) {
      return byType.research.map(stage => {
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
    
    // Fallback to hardcoded
    return workflowSteps
  }

  // Fetch all research requests
  async function fetchAll() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/research-requests');
      items.value = response;
    } catch (err) {
      error.value = err.message || 'Failed to fetch research requests';
    } finally {
      loading.value = false;
    }
  }

  // Fetch single research request
  async function fetchOne(id) {
    try {
      return await api.get(`/research-requests/${id}`);
    } catch (err) {
      error.value = err.message || 'Failed to fetch research request';
      return null;
    }
  }

  // Create research request
  async function create(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/research-requests', data);
      items.value.unshift(response);
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to create research request';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Update research request status
  async function updateStatus(id, status, notes = '') {
    try {
      const response = await api.put(`/research-requests/${id}/status`, { status, notes });
      const idx = items.value.findIndex(i => i.id === id);
      if (idx >= 0) items.value[idx] = response;
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to update research request';
      throw err;
    }
  }

  // Delete research request
  async function remove(id) {
    try {
      await api.delete(`/research-requests/${id}`);
      items.value = items.value.filter(i => i.id !== id);
    } catch (err) {
      error.value = err.message || 'Failed to delete research request';
      throw err;
    }
  }

  // Get status label
  const ALL_STATUSES = computed(() => {
    const byType = dmStore.settings.requestPipelinesByType || {}
    const requestTypes = dmStore.settings.requestTypes || []
    const researchTypeKeys = requestTypes
      .filter(t => ['designer', 'illustrator', 'researcher'].includes(t.category))
      .map(t => normalizeStatus(t.value))

    const dynamic = researchTypeKeys
      .flatMap(typeKey => {
        const stages = byType[typeKey]
        return Array.isArray(stages) ? stages : []
      })
      .map(stage => {
        if (typeof stage === 'string') {
          const normalized = normalizeStatus(stage)
          return { key: normalized, label: titleizeStatus(normalized) }
        }
        const normalized = normalizeStatus(stage.status)
        return {
          key: normalized,
          label: stage.label || titleizeStatus(normalized),
        }
      })
      .filter(s => s.key)

    const merged = [...fallbackStatuses, ...dynamic]
    const seen = new Set()
    return merged.filter(s => {
      if (!s.key || seen.has(s.key)) return false
      seen.add(s.key)
      return true
    })
  })

  const statuses = computed(() => ALL_STATUSES.value)

  function statusLabel(key) {
    return ALL_STATUSES.value.find(s => s.key === normalizeStatus(key))?.label || titleizeStatus(key);
  }

  // Get status badge class
  function statusBadgeClass(key) {
    const normalizedKey = normalizeStatus(key)
    const classMap = {
      submitted: 'submitted',
      in_progress: 'in-progress',
      completed: 'completed',
      on_hold: 'on-hold',
    };
    return classMap[normalizedKey] || 'submitted';
  }

  function getWorkflowSteps(request = null) {
    const pipeline = getResearchPipeline(request)
    if (Array.isArray(pipeline) && pipeline.length > 0) {
      return pipeline
    }
    return workflowSteps;
  }

  function pipeClass(stepStatus, currentStatus, request = null) {
    const normalizedCurrentStatus = normalizeStatus(currentStatus)
    const normalizedStepStatus = normalizeStatus(stepStatus)
    
    const pipeline = getResearchPipeline(request)
    const order = (Array.isArray(pipeline) && pipeline.length > 0 
      ? pipeline.map(s => normalizeStatus(s.status || s)) 
      : workflowSteps.map(s => normalizeStatus(s.status)))
    const effectiveCurrentStatus = resolveEffectiveCurrentStatus(normalizedCurrentStatus, order)
    const ci = order.indexOf(effectiveCurrentStatus);
    const si = order.indexOf(normalizedStepStatus);
    if (normalizedStepStatus === effectiveCurrentStatus) return 'active';
    if (ci >= 0 && si >= 0 && si < ci) return 'done';
    return 'pending';
  }

  function getAvailableActions(status, role, request = null) {
    if (!['designer', 'super_admin'].includes(role)) return [];

    const steps = getWorkflowSteps(request)
    const order = steps.map(s => normalizeStatus(s.status))
    const current = resolveEffectiveCurrentStatus(status, order)
    const idx = order.indexOf(current)

    if (idx >= 0 && idx < order.length - 1) {
      const next = steps[idx + 1]
      return [
        {
          action: 'advance_pipeline',
          label: `Next: ${next.label || titleizeStatus(next.status)}`,
          icon: '▶️',
          nextStatus: normalizeStatus(next.status),
          primary: true,
        },
      ]
    }

    if (current === 'on_hold' && order.includes('in_progress')) {
      return [
        { action: 'resume_project', label: 'Resume Project', icon: '▶️', nextStatus: 'in_progress', primary: true },
      ]
    }

    return [];
  }

  return {
    items,
    loading,
    error,
    quarters,
    ALL_STATUSES,
    statuses,
    helpCategories,
    fetchAll,
    fetchOne,
    create,
    updateStatus,
    remove,
    statusLabel,
    statusBadgeClass,
    getWorkflowSteps,
    pipeClass,
    getAvailableActions,
  };
});
