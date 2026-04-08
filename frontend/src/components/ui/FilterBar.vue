<template>
    <div class="d-flex gap-2 mb-4 flex-wrap">
        <!-- Search input -->
        <div v-if="showSearch" class="input-group" style="max-width: 300px">
            <span class="input-group-text">🔍</span>
            <input type="text" class="form-control" :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)" :placeholder="searchPlaceholder">
        </div>

        <!-- Filter dropdowns -->
        <Dropdown 
            v-for="filter in filters" 
            :key="filter.key"
            :model-value="filter.value"
            :options="filter.options"
            :placeholder="filter.placeholder"
            :style="{ width: filter.width || '150px' }"
            @update:model-value="$emit('update:filter', { key: filter.key, value: $event })"
        />

        <slot name="actions"></slot>
    </div>
</template>

<script setup>
    import { Dropdown } from './index.js'

    defineProps({
        modelValue: {
            type: String,
            default: '',
        },
        showSearch: {
            type: Boolean,
            default: true,
        },
        searchPlaceholder: {
            type: String,
            default: 'Search...',
        },
        filters: {
            type: Array,
            default: () => [],
            // { key, placeholder, value, options: [{ value, label }], width }
        },
    })

    defineEmits(['update:modelValue', 'update:filter'])
</script>