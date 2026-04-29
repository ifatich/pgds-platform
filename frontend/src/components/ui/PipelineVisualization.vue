<template>
  <div class="pipeline-container">
    <div class="pipeline-track">
      <div v-for="(step, idx) in steps" :key="step.status" class="pipeline-step">
        <!-- Step Badge using Badge component with status color -->
        <div class="step-wrapper" :class="{ 'has-recovery': step.onFailStatus }">
          <div class="badge-container" :class="getStatusColorClass(step.status)">
            <span class="step-label">{{ getStepLabel(step) }}</span>
            <span v-if="step.onFailStatus" class="step-recovery-icon" title="Has recovery/fallback path">↻</span>
          </div>
        </div>

        <!-- Arrow to next step -->
        <div v-if="idx < steps.length - 1" class="step-arrow">
          →
        </div>

        <!-- On-fail indicator (fallback target) -->
        <div v-if="step.onFailStatus && idx < steps.length - 1" class="on-fail-indicator">
          <span class="on-fail-arrow">↙</span>
          <span class="on-fail-label">→ {{ step.onFailStatus }}</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div v-if="showLegend" class="pipeline-legend">
      <div class="legend-item">
        <div class="color-sample pending"></div>
        <span>Pending (Belum dikerjakan)</span>
      </div>
      <div class="legend-item">
        <div class="color-sample active"></div>
        <span>In Progress (Sedang berlangsung)</span>
      </div>
      <div class="legend-item">
        <div class="color-sample done"></div>
        <span>Completed (Selesai)</span>
      </div>
      <div class="legend-item">
        <div class="color-sample recovery"></div>
        <span>↻ Recovery Path (Revisi/Mundur)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  steps: {
    type: Array,
    required: true, // Array of {status, label, onFailStatus}
  },
  currentStatus: {
    type: String,
    required: true,
  },
  getStatusClass: {
    type: Function,
    required: true, // Function(status, currentStatus) -> 'active'|'done'|'pending'|'recovery'
  },
  showLegend: {
    type: Boolean,
    default: false,
  },
})

function getStepLabel(step) {
  return step.label || step.status
}

function getStatusColorClass(status) {
  const baseClass = props.getStatusClass(status, props.currentStatus)
  
  const classMap = {
    active: 'status-active',      // 🔵 Biru - sedang berlangsung
    done: 'status-done',           // 🟢 Hijau - selesai
    recovery: 'status-recovery',   // 🟨 Kuning - kembali/mundur/revisi
    pending: 'status-pending',     // ⚫ Abu-abu - belum dikerjakan
  }
  
  return classMap[baseClass] || classMap.pending
}
</script>

<style scoped>
.pipeline-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pipeline-track {
  display: flex;
  align-items: flex-start;
  gap: 0;
  flex-wrap: wrap;
  position: relative;
}

.pipeline-step {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  margin-bottom: 12px;
}

.step-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.step-wrapper.has-recovery .badge-container::after {
  content: '';
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ffc107;
  border-radius: 50%;
  border: 1px solid white;
}

.badge-container {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  position: relative;
  cursor: default;
}

.badge-container:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* Status Color Classes */
.status-pending {
  background-color: #d1d5db;        /* Abu-abu - Pending */
  color: #4b5563;
  border: 1px solid #9ca3af;
}

.status-active {
  background-color: #3b82f6;        /* Biru - Active/Current */
  color: #ffffff;
  border: 1px solid #2563eb;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

.status-done {
  background-color: #10b981;        /* Hijau - Done */
  color: #ffffff;
  border: 1px solid #059669;
}

.status-recovery {
  background-color: #fbbf24;        /* Kuning - Recovery/Revisi */
  color: #78350f;
  border: 1px solid #f59e0b;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.35);
}

.status-active:hover {
  background-color: #2563eb;
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.4);
}

.status-done:hover {
  background-color: #059669;
}

.status-pending:hover {
  background-color: #b3b7c3;
}

.status-recovery:hover {
  background-color: #f59e0b;
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.45);
}

.step-label {
  display: inline;
}

.step-recovery-icon {
  font-size: 11px;
  margin-left: 2px;
  opacity: 0.8;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.step-arrow {
  color: #9ca3af;
  font-weight: 600;
  margin: 0 8px;
  line-height: 1;
  font-size: 14px;
}

.on-fail-indicator {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
  font-size: 10px;
  color: #fbbf24;
  opacity: 0.85;
}

.on-fail-arrow {
  font-size: 12px;
  font-weight: 700;
}

.on-fail-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(251, 191, 36, 0.12);
  color: #b45309;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.pipeline-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #6b7280;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-sample {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.color-sample.pending {
  background-color: #d1d5db;
  border-color: #9ca3af;
}

.color-sample.active {
  background-color: #3b82f6;
  border-color: #2563eb;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.color-sample.done {
  background-color: #10b981;
  border-color: #059669;
}

.color-sample.recovery {
  background-color: #fbbf24;
  border-color: #f59e0b;
}

/* Responsive */
@media (max-width: 768px) {
  .pipeline-track {
    gap: 2px;
  }

  .badge-container {
    font-size: 11px;
    padding: 6px 10px;
  }

  .step-arrow {
    margin: 0 4px;
    font-size: 12px;
  }

  .on-fail-indicator {
    font-size: 9px;
  }

  .pipeline-legend {
    font-size: 11px;
    gap: 12px;
  }

  .color-sample {
    width: 14px;
    height: 14px;
  }
}
</style>
