<template>
  <svg :class="cls" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M17 15l-5-5-5 5" />
  </svg>
</template>

<script setup>
defineProps({
  cls: { type: String, default: 'w-5 h-5' },
})
</script>