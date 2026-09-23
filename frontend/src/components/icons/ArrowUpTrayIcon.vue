<template>
  <svg :class="cls" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 7.5V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25V7.5m18 0v10A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V7.5m0 0L12 2.25m0 5.25v10" />
  </svg>
</template>

<script setup>
defineProps({
  cls: { type: String, default: 'w-5 h-5' },
})
</script>