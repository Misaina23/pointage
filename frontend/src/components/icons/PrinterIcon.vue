<template>
  <svg :class="cls" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-8a2 2 0 00-2-2H9a2 2 0 00-2 2v8m14-8H7m10 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
  </svg>
</template>

<script setup>
defineProps({
  cls: { type: String, default: 'w-5 h-5' },
})
</script>