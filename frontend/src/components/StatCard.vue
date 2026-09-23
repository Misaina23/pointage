<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-500">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-1">{{ value }}</p>
      </div>
      <div :class="iconBgClass" class="p-3 rounded-xl">
        <component :is="icon" :class="iconClass" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: [Object, String], required: true },
  color: { type: String, default: 'blue' },
})

const colorClasses = {
  blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
  green: { bg: 'bg-green-100', icon: 'text-green-600' },
  yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
  red: { bg: 'bg-red-100', icon: 'text-red-600' },
}

const iconBgClass = computed(() => colorClasses[props.color]?.bg || colorClasses.blue.bg)
const iconClass = computed(() => colorClasses[props.color]?.icon || colorClasses.blue.icon)
</script>