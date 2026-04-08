<template>
  <div>
    <PageHeader 
      title="Research Requests" 
      :subtitle="`${filteredItems.length} requests ditemukan`"
      :actionLabel="isLoggedIn ? '+ New Research Request' : null"
      @action="openNewResearchModal"
    />

    <!-- Filters -->
    <div class="row g-2 mb-4">
      <div class="col-12 col-sm-auto flex-grow-1">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">🔍</span>
          <input 
            type="text" 
            class="form-control border-start-0" 
            v-model="search" 
            placeholder="Search project name..."
          >
        </div>
      </div>
      <div class="col-12 col-sm-auto">
        <Dropdown 
          v-model="filterStatus"
          :options="filterStatusOptions"
          placeholder="All Status"
          variant="outline-secondary"
          size="sm"
          style="min-width: 150px"
        />
      </div>
    </div>

    <!-- Loading State -->
    <EmptyState 
      v-if="researchStore.loading"
      icon="⏳"
      message="Loading..."
    />

    <!-- Empty State -->
    <EmptyState 
      v-else-if="filteredItems.length === 0"
      icon="📋"
      message="Tidak ada research request ditemukan"
    />

    <!-- Request Cards -->
    <div v-else class="row g-3 mb-4">
      <div v-for="req in paginated" :key="req.id" class="col-12">
        <div class="card card-hover cursor-pointer" @click="selectedRequest = req">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="flex-grow-1">
                <h5 class="card-title fw-bold mb-1">{{ req.projectName }}</h5>
                <p class="card-text text-secondary small mb-0">
                  <span>{{ req.whatWeHelp }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ req.department || 'N/A' }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ formatDate(req.updatedAt) }}</span>
                </p>
              </div>
              <span class="badge ms-2" :class="'b-' + researchStore.statusBadgeClass(req.status)">
                {{ researchStore.statusLabel(req.status) }}
              </span>
            </div>
            <div>
              <span class="badge badge-pill" style="background: var(--s100); color: var(--s600);">
                {{ req.timelineQuarter }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" aria-label="Page navigation">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="page--">← Previous</button>
        </li>
        <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === page }">
          <button class="page-link" @click="page = p">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page === totalPages }">
          <button class="page-link" @click="page++">Next →</button>
        </li>
      </ul>
    </nav>

    <!-- New Research Request Modal (Pure Bootstrap) -->
    <div class="modal fade" id="newResearchModal" tabindex="-1" aria-labelledby="newResearchLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="newResearchLabel">New Research Request</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="submitForm">
            <div class="modal-body">
              <!-- What can we help -->
              <div class="mb-3">
                <label class="form-label">What can we help? <span class="text-danger">*</span></label>
                <Dropdown
                  v-model="formData.whatWeHelp"
                  :options="whatWeHelpOptions"
                  placeholder="Select category..."
                  variant="outline-secondary"
                  size="sm"
                />
              </div>

              <!-- Department -->
              <div class="mb-3">
                <label for="department" class="form-label">Department</label>
                <input
                  id="department"
                  v-model="formData.department"
                  type="text"
                  class="form-control"
                  placeholder="e.g. Product, Engineering"
                >
              </div>

              <!-- Project Name -->
              <div class="mb-3">
                <label for="projectName" class="form-label">Project / Request Name <span class="text-danger">*</span></label>
                <input
                  id="projectName"
                  v-model="formData.projectName"
                  type="text"
                  class="form-control"
                  required
                  placeholder="e.g. Dashboard Redesign"
                >
              </div>

              <!-- Problem Description -->
              <div class="mb-3">
                <label for="problemDescription" class="form-label">Problem / Need Description <span class="text-danger">*</span></label>
                <textarea
                  id="problemDescription"
                  v-model="formData.problemDescription"
                  class="form-control"
                  required
                  rows="3"
                  placeholder="Please explain the problem or need..."
                ></textarea>
              </div>

              <!-- Timeline -->
              <div class="mb-3">
                <label class="form-label">Timeline (Quarter) <span class="text-danger">*</span></label>
                <Dropdown
                  v-model="formData.timelineQuarter"
                  :options="timelineOptions"
                  placeholder="Select quarter..."
                  variant="outline-secondary"
                  size="sm"
                />
              </div>

              <!-- Attachment -->
              <div class="mb-3">
                <label for="attachment" class="form-label">Attachment (BRD or supporting document)</label>
                <div
                  class="border border-2 border-dashed rounded p-3 text-center cursor-pointer"
                  :class="formData.attachmentName ? 'border-success bg-success-subtle' : 'border-secondary'"
                  @click="fileInputRef?.click()"
                  @dragover.prevent
                  @drop.prevent="handleFileDrop"
                >
                  <div v-if="formData.attachmentName" class="small fw-medium text-success">
                    ✓ {{ formData.attachmentName }}
                  </div>
                  <div v-else class="small text-muted">
                    📎 Click or drag file here
                  </div>
                </div>
                <input
                  ref="fileInputRef"
                  id="attachment"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  class="d-none"
                  @change="handleFileUpload"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Request</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Request Detail Modal (Pure Bootstrap) -->
    <div v-if="selectedRequest" class="modal fade show d-block" tabindex="-1" role="dialog" style="background: rgba(11, 22, 40, 0.55);">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5">{{ selectedRequest.projectName }}</h1>
            <button type="button" class="btn-close" aria-label="Close" @click="selectedRequest = null"></button>
          </div>
          <div class="modal-body">
            <!-- Detail Grid -->
            <div class="row row-cols-1 row-cols-md-2 g-3 mb-4">
              <div class="col">
                <div><strong>Status:</strong></div>
                <span class="badge" :class="'b-' + researchStore.statusBadgeClass(selectedRequest.status)">
                  {{ researchStore.statusLabel(selectedRequest.status) }}
                </span>
              </div>
              <div class="col">
                <div><strong>Department:</strong></div>
                <span>{{ selectedRequest.department || 'N/A' }}</span>
              </div>
              <div class="col">
                <div><strong>Category:</strong></div>
                <span>{{ selectedRequest.whatWeHelp }}</span>
              </div>
              <div class="col">
                <div><strong>Timeline:</strong></div>
                <span>{{ selectedRequest.timelineQuarter }}</span>
              </div>
              <div class="col">
                <div><strong>Requester:</strong></div>
                <span>{{ selectedRequest.requesterName }} ({{ selectedRequest.requesterEmail }})</span>
              </div>
              <div class="col">
                <div><strong>Submitted:</strong></div>
                <span>{{ formatDate(selectedRequest.createdAt) }}</span>
              </div>
            </div>

            <!-- Problem / Need -->
            <div class="mb-4">
              <h6 class="fw-bold mb-2">Problem / Need</h6>
              <p class="text-secondary">{{ selectedRequest.problemDescription }}</p>
            </div>

            <!-- Notes -->
            <div v-if="selectedRequest.notes" class="mb-4">
              <h6 class="fw-bold mb-2">Notes</h6>
              <p class="text-secondary">{{ selectedRequest.notes }}</p>
            </div>

            <!-- Attachment -->
            <div v-if="selectedRequest.attachmentName" class="mb-4">
              <h6 class="fw-bold mb-2">Attachment</h6>
              <a v-if="selectedRequest.attachmentDataUrl" :href="selectedRequest.attachmentDataUrl" download :download="selectedRequest.attachmentName" class="btn btn-sm btn-secondary">
                ⬇️ {{ selectedRequest.attachmentName }}
              </a>
            </div>

            <!-- Update Status -->
            <div v-if="canUpdate" class="mb-4">
              <h6 class="fw-bold mb-2">Update Status</h6>
              <div class="row g-2">
                <div class="col-12">
                  <Dropdown 
                    v-model="updateFormData.status"
                    :options="updateStatusOptions"
                    placeholder="Select status..."
                    variant="outline-secondary"
                    size="sm"
                  />
                </div>
                <div class="col-12">
                  <textarea v-model="updateFormData.notes" class="form-control" rows="2" placeholder="Add notes (optional)"></textarea>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button v-if="user.id === selectedRequest.requesterId || user.role === 'super_admin'" @click="deleteRequest" class="btn btn-danger me-auto">Delete</button>
            <button v-if="canUpdate" @click="submitStatusUpdate" class="btn btn-primary">Update</button>
            <button @click="selectedRequest = null" class="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useResearchStore } from '@/stores/research';
import { formatDate } from '@/composables/useFormat';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/menu';
import { PageHeader, EmptyState, Dropdown } from '@/components/ui'
import { Modal as BootstrapModal } from 'bootstrap'

const researchStore = useResearchStore();
const authStore = useAuthStore();
const ui = useUiStore();
const fileInputRef = ref(null);

const search = ref('');
const filterStatus = ref('');
const selectedRequest = ref(null);
const page = ref(1);
const pageSize = 10;

const formData = ref({
  whatWeHelp: '',
  projectName: '',
  problemDescription: '',
  timelineQuarter: '',
  department: '',
  attachmentName: '',
  attachmentDataUrl: '',
});

const updateFormData = ref({
  status: '',
  notes: '',
});

const user = computed(() => authStore.user || {});
const isLoggedIn = computed(() => !!user.value.id);
const canUpdate = computed(() => ['designer', 'super_admin'].includes(user.value.role));

// Dropdown options
const filterStatusOptions = computed(() => [
  { value: '', label: 'All Status' },
  ...researchStore.statuses.map(s => ({ value: s.key, label: s.label }))
]);

const whatWeHelpOptions = computed(() => [
  { value: '', label: 'Select category...' },
  ...researchStore.helpCategories.map(cat => ({ value: cat, label: cat }))
]);

const timelineOptions = computed(() => [
  { value: '', label: 'Select quarter...' },
  ...researchStore.quarters.map(q => ({ value: q, label: q }))
]);

const updateStatusOptions = computed(() => 
  researchStore.statuses.map(s => ({ value: s.key, label: s.label }))
);

const filteredItems = computed(() => {
  return researchStore.items.filter(req => {
    const matchesSearch = !search.value || 
      req.projectName.toLowerCase().includes(search.value.toLowerCase()) ||
      req.whatWeHelp.toLowerCase().includes(search.value.toLowerCase());
    
    const matchesStatus = !filterStatus.value || req.status === filterStatus.value;
    
    return matchesSearch && matchesStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredItems.value.length / pageSize));

const paginated = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredItems.value.slice(start, start + pageSize);
});

const visiblePages = computed(() => {
  const pages = [];
  for (let i = Math.max(1, page.value - 2); i <= Math.min(totalPages.value, page.value + 2); i++) {
    pages.push(i);
  }
  return pages;
});

function handleFileDrop(event) {

  formData.value.attachmentName = file.name;
  const file = event.target.files?.[0];
  if (!file) return;

  formData.value.attachmentName = file.name;
  
  // Convert to base64
  const reader = new FileReader();
  reader.onload = (e) => {
    formData.value.attachmentDataUrl = e.target?.result;
  };
  reader.readAsDataURL(file);
}

async function submitForm() {
  try {
    await researchStore.create(formData.value);
    // Close modal using Bootstrap API
    const modalElement = document.getElementById('newResearchModal');
    const modal = window.bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
    formData.value = {
      whatWeHelp: '',
      projectName: '',
      problemDescription: '',
      timelineQuarter: '',
      department: '',
      attachmentName: '',
      attachmentDataUrl: '',
    };
  } catch (err) {
    alert('Error: ' + (err.message || 'Failed to create research request'));
  }
}

async function submitStatusUpdate() {
  if (!selectedRequest.value) return;
  try {
    const updated = await researchStore.updateStatus(
      selectedRequest.value.id,
      updateFormData.value.status,
      updateFormData.value.notes
    );
    selectedRequest.value = updated;
    updateFormData.value = { status: '', notes: '' };
  } catch (err) {
    alert('Error: ' + (err.message || 'Failed to update status'));
  }
}

async function deleteRequest() {
  if (!selectedRequest.value) return;
  if (!confirm('Are you sure you want to delete this research request?')) return;
  
  try {
    await researchStore.remove(selectedRequest.value.id);
    selectedRequest.value = null;
  } catch (err) {
    alert('Error: ' + (err.message || 'Failed to delete'));
  }
}

function openNewResearchModal() {
  if (!isLoggedIn.value) {
    ui.showToast('You must be logged in to create a research request', 'err')
    return
  }
  const modalElement = document.getElementById('newResearchModal')
  const modal = new BootstrapModal(modalElement)
  modal.show()
}

onMounted(async () => {
  await researchStore.fetchAll();
});
</script>

<style scoped>
.req-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.req-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.req-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.req-card-hd {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.req-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1f2937;
}

.req-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.req-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.badge.b-submitted {
  background: #dbeafe;
  color: #1e40af;
}

.badge.b-in-progress {
  background: #fef3c7;
  color: #92400e;
}

.badge.b-completed {
  background: #dcfce7;
  color: #166534;
}

.badge.b-on-hold {
  background: #fee2e2;
  color: #991b1b;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.file-input-wrapper {
  position: relative;
}

.file-input-wrapper input[type="file"] {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #d1d5db;
  border-radius: 4px;
}

.file-name {
  display: block;
  color: #10b981;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.detail-grid div {
  display: flex;
  flex-direction: column;
}

.detail-grid strong {
  color: #374151;
  margin-bottom: 0.25rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-weight: 600;
}

.detail-section p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
  white-space: pre-wrap;
}

.status-update {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
