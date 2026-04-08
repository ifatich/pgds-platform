// frontend/src/stores/research.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';

export const useResearchStore = defineStore('research', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const statuses = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'on_hold', label: 'On Hold' },
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
  function statusLabel(key) {
    return statuses.find(s => s.key === key)?.label || key;
  }

  // Get status badge class
  function statusBadgeClass(key) {
    const classMap = {
      submitted: 'submitted',
      in_progress: 'in-progress',
      completed: 'completed',
      on_hold: 'on-hold',
    };
    return classMap[key] || 'submitted';
  }

  return {
    items,
    loading,
    error,
    quarters,
    statuses,
    helpCategories,
    fetchAll,
    fetchOne,
    create,
    updateStatus,
    remove,
    statusLabel,
    statusBadgeClass,
  };
});
