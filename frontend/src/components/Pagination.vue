<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2" aria-label="Pagination">
    <button
      @click="goToPage(currentPage - 1)"
      :disabled="currentPage === 1"
      class="btn-pagination"
      aria-label="Page précédente"
    >
      <ChevronLeftIcon class="w-5 h-5" />
    </button>

    <span v-if="currentPage > 3" class="px-2 text-gray-500">...</span>

    <template v-for="page in visiblePages" :key="page">
      <button
        @click="goToPage(page)"
        :class="['btn-pagination', { 'active': page === currentPage }]"
        :aria-current="page === currentPage ? 'page' : undefined"
      >
        {{ page }}
      </button>
    </template>

    <span v-if="currentPage < totalPages - 2" class="px-2 text-gray-500">...</span>

    <button
      @click="goToPage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="btn-pagination"
      aria-label="Page suivante"
    >
      <ChevronRightIcon class="w-5 h-5" />
    </button>
  </nav>
</template>

<script setup>
import ChevronLeftIcon from './icons/ChevronLeftIcon.vue'
import ChevronRightIcon from './icons/ChevronRightIcon.vue'

defineProps({
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  maxVisible: { type: Number, default: 5 },
})

defineEmits(['update:currentPage'])

const visiblePages = computed(() => {
  const pages = []
  const half = Math.floor(props.maxVisible / 2)
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(props.totalPages, start + props.maxVisible - 1)

  if (end - start + 1 < props.maxVisible) {
    start = Math.max(1, end - props.maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}
</script>

<style scoped>
.btn-pagination {
  @apply px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-pagination:not(.active) {
  @apply bg-white border-gray-300 text-gray-700 hover:bg-gray-50;
}

.btn-pagination.active {
  @apply bg-blue-600 border-blue-600 text-white;
}

.btn-pagination:not(.active):not(:disabled):hover {
  @apply bg-gray-50;
}
</style>