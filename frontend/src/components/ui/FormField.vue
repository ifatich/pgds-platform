<template>
    <div class="mb-3">
        <label v-if="label" :for="id" class="form-label">
            {{ label }}
            <span v-if="required" class="text-danger">*</span>
        </label>
        <input v-if="type === 'text' || type === 'email' || type === 'password'" :id="id" :type="type"
            class="form-control" :class="{ 'is-invalid': error }" :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)" :placeholder="placeholder" :required="required"
            v-bind="$attrs">
        <textarea v-else-if="type === 'textarea'" :id="id" class="form-control" :class="{ 'is-invalid': error }"
            :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :placeholder="placeholder"
            :required="required" v-bind="$attrs"></textarea>
        <Dropdown 
            v-else-if="type === 'select'"
            :id="id"
            :model-value="modelValue"
            :options="options"
            :placeholder="placeholder"
            @update:model-value="$emit('update:modelValue', $event)"
        />
        <div v-if="error" class="invalid-feedback d-block">{{ error }}</div>
        <small v-if="hint" class="form-text text-muted">{{ hint }}</small>
    </div>
</template>

<script setup>
    import { Dropdown } from './index.js'

    defineProps({
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            default: 'text', // text, email, password, textarea, select
        },
        label: {
            type: String,
            default: null,
        },
        modelValue: {
            type: [String, Number],
            default: '',
        },
        placeholder: {
            type: String,
            default: '',
        },
        error: {
            type: String,
            default: null,
        },
        hint: {
            type: String,
            default: null,
        },
        required: {
            type: Boolean,
            default: false,
        },
        options: {
            type: Array,
            default: () => [],
            // { value, label }
        },
    })

    defineEmits(['update:modelValue'])
</script>