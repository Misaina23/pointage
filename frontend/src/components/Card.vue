<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <component :is="icon" class="w-5 h-5 text-gray-500" v-if="icon" />
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>
      <slot name="header" />
    </div>
    <div class="p-6">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: [Object, String], default: null },
})
</script>