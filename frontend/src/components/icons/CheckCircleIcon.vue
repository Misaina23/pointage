<template>
  <svg :class="cls" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
</template>

<script setup>
defineProps({
  cls: { type: String, default: 'w-5 h-5' },
})
</script>