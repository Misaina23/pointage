<template>
  <component :is="component" :class="cls" />
</template>

<script setup>
import { computed } from 'vue'
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  QrCodeIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DownloadIcon,
  PrinterIcon,
  RefreshIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from './icons'

const iconMap = {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  QrCodeIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DownloadIcon,
  PrinterIcon,
  RefreshIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
}

defineProps({
  name: {
    type: String,
    required: true,
  },
  cls: {
    type: String,
    default: 'w-5 h-5',
  },
})

const component = computed(() => iconMap[props.name] || HomeIcon)
</script>