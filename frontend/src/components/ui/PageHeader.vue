<template>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
            <h2 class="mb-1">{{ title }}</h2>
            <p v-if="subtitle" class="text-secondary">{{ subtitle }}</p>
        </div>
        <div v-if="showAction" class="d-flex gap-2 flex-wrap">
            <slot name="actions">
                <button v-if="actionLabel" class="btn" :class="actionClass" @click="$emit('action')">
                    {{ actionIcon }}{{ actionLabel }}
                </button>
            </slot>
        </div>
    </div>
</template>

<script setup>
    defineProps({
        title: {
            type: String,
            required: true,
        },
        subtitle: {
            type: String,
            default: null,
        },
        actionLabel: {
            type: String,
            default: null,
        },
        actionIcon: {
            type: String,
            default: '',
        },
        actionClass: {
            type: String,
            default: 'btn-primary',
        },
        showAction: {
            type: Boolean,
            default: true,
        },
    })

    defineEmits(['action'])
</script>