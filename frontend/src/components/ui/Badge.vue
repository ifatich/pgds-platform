<template>
    <span class="badge" :class="`b-${badgeClass}`" :style="customStyle">
        {{ label }}
    </span>
</template>

<script setup>
    defineProps({
        label: {
            type: String,
            required: true,
        },
        badgeClass: {
            type: String,
            required: true,
            // status: pending, in_progress, done, rejected, etc.
            // role: designer, engineer, developer, etc.
        },
        customStyle: {
            type: Object,
            default: () => ({}),
        },
    })
</script>