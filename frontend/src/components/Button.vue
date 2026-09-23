<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="flex items-center justify-center">
      <LoadingSpinner :size="iconSize" :color="iconColor" />
      <span class="ml-2">{{ loadingText }}</span>
    </span>
    <slot v-else />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: 'Chargement...' },
  type: { type: String, default: 'button' },
  class: { type: [String, Object], default: '' },
})

defineEmits(['click'])

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
}

const iconSize = computed(() => {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6', xl: 'h-7 w-7' }
  return sizes[props.size] || sizes.md
})

const iconColor = computed(() => {
  if (props.variant === 'primary' || props.variant === 'danger' || props.variant === 'success') return 'text-white'
  return 'text-current'
})

const externalClass = computed(() => {
  if (typeof props.class === 'string') return props.class
  if (typeof props.class === 'object') return props.class
  return ''
})

const buttonClasses = computed(() => [
  baseClasses,
  variantClasses[props.variant] || variantClasses.primary,
  sizeClasses[props.size] || sizeClasses.md,
  externalClass.value,
].join(' '))
</script>