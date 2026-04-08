<template>
    <div class="card text-center h-100">
        <div class="card-body">
            <div style="font-size: 32px; margin-bottom: 8px">{{ icon }}</div>
            <div class="fw-bold" style="font-size: 24px; margin-bottom: 8px" :style="{ color: color }">{{ value }}</div>
            <div class="text-secondary" style="font-size: 14px; margin-bottom: 8px">{{ label }}</div>
            <span v-if="badge" class="badge" :class="'bg-' + badgeType">{{ badge }}</span>
        </div>
    </div>
</template>

<script setup>
    defineProps({
        icon: {
            type: String,
            required: true,
        },
        value: {
            type: [String, Number],
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        color: {
            type: String,
            default: 'var(--g)',
        },
        badge: {
            type: String,
            default: null,
        },
        badgeType: {
            type: String,
            default: 'primary',
        },
    })
</script>