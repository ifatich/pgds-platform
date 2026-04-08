<template>
    <div class="row g-3" :style="{ marginBottom: marginBottom }">
        <div v-for="stat in stats" :key="stat.id" :class="['col-12', colClass]">
            <StatCard :icon="stat.icon" :value="stat.value" :label="stat.label" :color="stat.color" :badge="stat.badge"
                :badge-type="stat.badgeType" />
        </div>
    </div>
</template>

<script setup>
    import {
        computed
    } from 'vue'
    import StatCard from './StatCard.vue'

    const props = defineProps({
        stats: {
            type: Array,
            required: true,
            // { id, icon, value, label, color?, badge?, badgeType? }
        },
        columns: {
            type: Number,
            default: 4, // 2, 3, 4, 6
        },
        marginBottom: {
            type: String,
            default: '24px',
        },
    })

    const colClassMap = {
        2: 'col-md-6',
        3: 'col-md-4',
        4: 'col-sm-6 col-md-3',
        6: 'col-md-2',
    }

    const colClass = computed(() => colClassMap[props.columns] || 'col-md-3')
</script>