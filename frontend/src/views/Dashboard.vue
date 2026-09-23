<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p class="text-gray-600 mt-1">Vue d'ensemble du système de pointage</p>
      </div>
      <div class="flex items-center gap-3">
        <router-link to="/personnel/create" class="btn-primary">
          <PlusIcon class="w-5 h-5 mr-2" />
          Nouveau personnel
        </router-link>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Personnel"
        :value="stats.totalPersonnel"
        :icon="UsersIcon"
        color="blue"
      />
      <StatCard
        title="Présents aujourd'hui"
        :value="stats.presentToday"
        :icon="CheckCircleIcon"
        color="green"
      />
      <StatCard
        title="Absences en attente"
        :value="stats.pendingAbsences"
        :icon="ClockIcon"
        color="yellow"
      />
      <StatCard
        title="Directions"
        :value="stats.totalDirections"
        :icon="BuildingOfficeIcon"
        color="purple"
      />
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Pointages -->
      <Card title="Derniers pointages" :icon="ClockIcon">
        <div v-if="loadingPointages" class="flex justify-center py-8">
          <LoadingSpinner />
        </div>
        <div v-else-if="recentPointages.length === 0" class="text-center py-8 text-gray-500">
          Aucun pointage aujourd'hui
        </div>
        <div v-else class="space-y-3">
          <div v-for="p in recentPointages" :key="p.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-blue-700 font-medium text-sm">{{ p.prenom?.charAt(0) }}{{ p.nom?.charAt(0) }}</span>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ p.prenom }} {{ p.nom }}</p>
                <p class="text-sm text-gray-500">{{ p.IM }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4 text-sm">
              <span v-if="p.heure_entree" class="flex items-center gap-1 text-green-600">
                <CheckCircleIcon class="w-4 h-4" />
                Entrée: {{ p.heure_entree }}
              </span>
              <span v-if="p.heure_sortie" class="flex items-center gap-1 text-blue-600">
                <ArrowRightOnRectangleIcon class="w-4 h-4" />
                Sortie: {{ p.heure_sortie }}
              </span>
              <span v-if="p.status" :class="p.status === 'En retard' ? 'text-red-600' : 'text-green-600'" class="px-2 py-1 text-xs font-medium rounded-full bg-opacity-10">
                {{ p.status }}
              </span>
            </div>
          </div>
        </div>
        <router-link to="/pointages" class="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
          Voir tous les pointages
        </router-link>
      </Card>

      <!-- Recent Absences -->
      <Card title="Absences récentes" :icon="CalendarDaysIcon">
        <div v-if="loadingAbsences" class="flex justify-center py-8">
          <LoadingSpinner />
        </div>
        <div v-else-if="recentAbsences.length === 0" class="text-center py-8 text-gray-500">
          Aucune absence récente
        </div>
        <div v-else class="space-y-3">
          <div v-for="a in recentAbsences" :key="a.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">{{ a.personnel?.prenom }} {{ a.personnel?.nom }}</p>
              <p class="text-sm text-gray-500">{{ formatDate(a.date_debut) }} - {{ formatDate(a.date_fin) }}</p>
            </div>
            <span :class="getStatusClass(a.etat)" class="px-2 py-1 text-xs font-medium rounded-full">
              {{ a.etat }}
            </span>
          </div>
        </div>
        <router-link to="/absences" class="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
          Voir toutes les absences
        </router-link>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePersonnelStore } from '@/stores/personnel'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import {
  PlusIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
} from '@/components'
import Card from '@/components/Card.vue'
import StatCard from '@/components/StatCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const personnelStore = usePersonnelStore()
const authStore = useAuthStore()

const stats = ref({
  totalPersonnel: 0,
  presentToday: 0,
  pendingAbsences: 0,
  totalDirections: 0,
})

const recentPointages = ref([])
const recentAbsences = ref([])
const loadingPointages = ref(false)
const loadingAbsences = ref(false)

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

const getStatusClass = (status) => {
  const classes = {
    'En attente': 'bg-yellow-100 text-yellow-800',
    'Acceptée': 'bg-green-100 text-green-800',
    'Refusée': 'bg-red-100 text-red-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const fetchDashboardData = async () => {
  try {
    const [personnelRes, pointagesRes, absencesRes, directionsRes] = await Promise.all([
      api.get('/personnel', { params: { per_page: 1 } }),
      api.get('/pointages', { params: { per_page: 5 } }),
      api.get('/absences', { params: { per_page: 5, status: 'En attente' } }),
      api.get('/directions'),
    ])

    stats.value.totalPersonnel = personnelRes.data.total
    stats.value.totalDirections = directionsRes.data.length

    const pointages = pointagesRes.data.data
    stats.value.presentToday = pointages.filter(p => p.heure_entree && !p.heure_sortie).length
    recentPointages.value = pointages

    stats.value.pendingAbsences = absencesRes.data.total
    recentAbsences.value = absencesRes.data.data
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>