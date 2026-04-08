<template>
  <div class="card">
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td :colspan="columns.length">
              <slot name="empty">
                <EmptyState
                  icon="📋"
                  message="Belum ada data"
                  padding="40px 20px"
                />
              </slot>
            </td>
          </tr>
          <tr v-for="item in items" :key="item.id || item">
            <td v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]">
                {{ formatCellValue(item[col.key]) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import EmptyState from './EmptyState.vue'

defineProps({
  columns: {
    type: Array,
    required: true,
    // { key, label, width?: '100px' }
  },
  items: {
    type: Array,
    required: true,
  },
})

function formatCellValue(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? '✓' : '✗'
  return value
}
</script>
