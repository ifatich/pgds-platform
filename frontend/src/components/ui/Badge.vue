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

<style lang="scss" scoped>
    .badge {
        display: inline-block;
        padding: 0.25em 0.5em;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 0.25rem;
        color: #fff;
        background-color: #5cb85c;

        &.b-pending {
            background-color: #f0ad4e; // orange
        }
        &.b-in_progress {
            background-color: #5bc0de; // blue
        }
        &.b-done {
            background-color: #5cb85c; // green
        }
        &.b-rejected {
            background-color: #d9534f; // red
        }
    }

</style>