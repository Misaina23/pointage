<template>
  <svg :class="cls" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
</template>

<script setup>
defineProps({
  cls: { type: String, default: 'w-5 h-5' },
})
</script>