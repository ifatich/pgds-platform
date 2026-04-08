<template>
    <div class="empty-state" :style="{ padding: padding }">
        <div :style="{ fontSize: iconSize, marginBottom: '8px' }">{{ icon }}</div>
        <p :style="{ fontSize: textSize, color: textColor }">{{ message }}</p>
        <slot></slot>
    </div>
</template>

<script setup>
    defineProps({
        icon: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        padding: {
            type: String,
            default: '60px 20px',
        },
        iconSize: {
            type: String,
            default: '48px',
        },
        textSize: {
            type: String,
            default: '14px',
        },
        textColor: {
            type: String,
            default: 'var(--s700)',
        },
    })
</script>