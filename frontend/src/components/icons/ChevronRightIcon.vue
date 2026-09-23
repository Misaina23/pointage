<template>
  <svg :class="cls" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 5l7 7-7 7" />
  </svg>
</template>

<script setup>
defineProps({
  cls: { type: String, default: 'w-5 h-5' },
})
</script>