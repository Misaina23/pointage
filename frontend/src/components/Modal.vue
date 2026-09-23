<template>
  <Transition name="modal">
    <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('update:modelValue', false)">
      <div class="flex min-h-full items-center justify-center p-4">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />

        <!-- Modal panel -->
        <div class="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all">
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <button
              @click="$emit('update:modelValue', false)"
              class="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="p-4">
            <slot />
          </div>

          <div v-if="$slots.actions" class="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import XMarkIcon from './icons/XMarkIcon.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>