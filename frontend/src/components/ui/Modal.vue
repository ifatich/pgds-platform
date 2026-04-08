<template>
    <Teleport to="body">
        <transition name="fade">
            <!-- Backdrop -->
            <div v-if="modelValue" class="modal-backdrop fade show"></div>
        </transition>
        <transition name="fade">
            <div v-if="modelValue" class="modal fade show d-block" :style="{ display: 'block' }">
                <div class="modal-dialog" :class="[{ 'modal-dialog-centered': centered }]"
                    :style="{ maxWidth: maxWidth }">
                    <div class="modal-content">
                        <!-- Header -->
                        <div class="modal-header">
                            <h5 class="modal-title">{{ title }}</h5>
                            <button type="button" class="btn-close" @click="$emit('update:modelValue', false)"></button>
                        </div>

                        <!-- Body -->
                        <div class="modal-body">
                            <slot></slot>
                        </div>

                        <!-- Footer -->
                        <div v-if="showFooter" class="modal-footer">
                            <slot name="footer">
                                <button type="button" class="btn btn-secondary"
                                    @click="$emit('update:modelValue', false)">
                                    {{ cancelLabel }}
                                </button>
                                <button type="button" class="btn btn-primary" @click="$emit('confirm')">
                                    {{ confirmLabel }}
                                </button>
                            </slot>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
    defineProps({
        modelValue: {
            type: Boolean,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        showFooter: {
            type: Boolean,
            default: true,
        },
        centered: {
            type: Boolean,
            default: true,
        },
        maxWidth: {
            type: String,
            default: '500px',
        },
        cancelLabel: {
            type: String,
            default: 'Cancel',
        },
        confirmLabel: {
            type: String,
            default: 'Confirm',
        },
    })

    defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>