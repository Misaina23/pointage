<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Demandes d'absence</h1>
        <p class="text-gray-600 mt-1">Gestion des demandes d'absence du personnel</p>
      </div>
    </div>

    <!-- Filters -->
    <Card title="Filtres" icon="MagnifyingGlassIcon">
      <form @submit.prevent="fetchAbsences" class="flex flex-col sm:flex-row gap-4">
        <Input
          v-model="filters.search"
          id="search"
          name="search"
          placeholder="Rechercher par nom..."
          prependIcon="MagnifyingGlassIcon"
          class="flex-1"
        />
        <Select
          v-model="filters.status"
          id="status"
          name="status"
          label="Statut"
          :options="statusOptions"
          placeholder="Tous les statuts"
          class="w-48"
        />
        <Button type="submit" variant="primary">
          Filtrer
        </Button>
        <Button type="button" variant="secondary" @click="clearFilters">
          Réinitialiser
        </Button>
      </form>
    </Card>

    <Card title="Liste des absences" icon="CalendarDaysIcon">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="h-10 w-10" />
      </div>

      <div v-else-if="absences.length === 0" class="text-center py-12">
        <CalendarDaysIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p class="text-lg text-gray-500">Aucune demande d'absence</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full" role="table">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="absence in absences" :key="absence.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-blue-700 font-medium text-sm">{{ absence.personnel?.prenom?.charAt(0) }}{{ absence.personnel?.nom?.charAt(0) }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ absence.personnel?.prenom }} {{ absence.personnel?.nom }}</p>
                    <p class="text-sm text-gray-500">{{ absence.personnel?.IM }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-gray-900">{{ formatDate(absence.date_debut) }} - {{ formatDate(absence.date_fin) }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ absence.annee }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{{ absence.lieu }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" :title="absence.motif">{{ absence.motif }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge :variant="getStatusVariant(absence.etat)">{{ absence.etat }}</Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div v-if="absence.etat === 'En attente'" class="flex items-center justify-end gap-2">
                  <Button variant="success" size="sm" @click="updateStatus(absence, 'Acceptée')">
                    <CheckBadgeIcon class="w-4 h-4 mr-1" />
                    Accepter
                  </Button>
                  <Button variant="danger" size="sm" @click="updateStatus(absence, 'Refusée')">
                    <XCircleIcon class="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                </div>
                <span v-else class="text-gray-400 text-sm">Traité</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Affichage de {{ (pagination.current_page - 1) * pagination.per_page + 1 }} à
          {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} sur
          {{ pagination.total }} résultats
        </div>
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          @update:currentPage="changePage"
        />
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import { CalendarDaysIcon, MagnifyingGlassIcon, CheckBadgeIcon, XCircleIcon } from '@/components'
import Card from '@/components/Card.vue'
import Input from '@/components/Input.vue'
import Select from '@/components/Select.vue'
import Button from '@/components/Button.vue'
import Pagination from '@/components/Pagination.vue'
import Badge from '@/components/Badge.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Swal from 'sweetalert2'

const loading = ref(false)
const absences = ref([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
})

const filters = ref({
  search: '',
  status: '',
})

const statusOptions = ref([
  { value: '', label: 'Tous' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Acceptée', label: 'Acceptée' },
  { value: 'Refusée', label: 'Refusée' },
])

const fetchAbsences = async (page = 1) => {
  loading.value = true
  try {
    const params = { page, per_page: 15 }
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.status) params.status = filters.value.status
    const response = await api.get('/absences', { params })
    absences.value = response.data.data
    pagination.value = {
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    }
  } catch (error) {
    Swal.fire('Erreur', 'Impossible de charger les absences', 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  fetchAbsences(page)
}

const clearFilters = () => {
  filters.value = { search: '', status: '' }
  fetchAbsences(1)
}

const updateStatus = async (absence, status) => {
  try {
    await api.put(`/absences/${absence.id}/status`, { status })
    Swal.fire('Succès', `Demande ${status.toLowerCase()}`, 'success')
    fetchAbsences(pagination.value.current_page)
  } catch (error) {
    Swal.fire('Erreur', 'Impossible de mettre à jour', 'error')
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getStatusVariant = (status) => {
  const variants = {
    'En attente': 'warning',
    'Acceptée': 'success',
    'Refusée': 'danger',
  }
  return variants[status] || 'default'
}

onMounted(() => {
  fetchAbsences()
})
</script>