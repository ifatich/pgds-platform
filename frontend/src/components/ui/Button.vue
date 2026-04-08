<template>
    <button :type="type" class="btn" :class="[`btn-${variant}`, { 'btn-sm': size === 'sm', 'btn-lg': size === 'lg' }]"
        :disabled="disabled || loading" v-bind="$attrs">
        <span v-if="icon" style="margin-right: 4px">{{ icon }}</span>
        <span v-if="loading" style="margin-right: 4px">⏳</span>
        {{ label }}
    </button>
</template>

<script setup>
    defineProps({
        label: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            default: 'button', // button, submit, reset
        },
        variant: {
            type: String,
            default: 'primary', // primary, secondary, success, danger, warning, outline-primary, outline-secondary, etc.
        },
        size: {
            type: String,
            default: 'md', // sm, md, lg
        },
        icon: {
            type: String,
            default: null,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    })
</script>