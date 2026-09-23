<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pointages du jour</h1>
        <p class="text-gray-600 mt-1">Liste des pointages d'aujourd'hui</p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="secondary" @click="fetchPointages">
          <RefreshIcon class="w-5 h-5 mr-2" />
          Actualiser
        </Button>
        <Button variant="danger" @click="confirmReset">
          <ArrowPathIcon class="w-5 h-5 mr-2" />
          Réinitialiser
        </Button>
      </div>
    </div>

    <Card title="Pointages d'aujourd'hui" icon="CheckCircleIcon">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="h-10 w-10" />
      </div>

      <div v-else-if="pointages.length === 0" class="text-center py-12">
        <CheckCircleIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p class="text-lg text-gray-500">Aucun pointage aujourd'hui</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full" role="table">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IM</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrée</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sortie</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="p in pointages" :key="p.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-blue-700 font-medium text-sm">{{ p.prenom?.charAt(0) }}{{ p.nom?.charAt(0) }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ p.prenom }} {{ p.nom }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ p.IM }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="p.heure_entree" class="text-green-600 font-medium">{{ p.heure_entree }}</span>
                <span v-else class="text-gray-400">--:--</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="p.heure_sortie" class="text-blue-600 font-medium">{{ p.heure_sortie }}</span>
                <span v-else class="text-gray-400">--:--</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge v-if="p.status" :variant="p.status === 'En retard' ? 'danger' : 'success'">{{ p.status }}</Badge>
                <span v-else class="text-gray-400">En attente</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button variant="ghost" size="sm" @click="viewDetails(p)" v-if="p.heure_entree || p.heure_sortie">
                  <EyeIcon class="w-4 h-4 mr-1" />
                  Détails
                </Button>
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
import { CheckCircleIcon, RefreshIcon, ArrowPathIcon, EyeIcon } from '@/components'
import Card from '@/components/Card.vue'
import Button from '@/components/Button.vue'
import Pagination from '@/components/Pagination.vue'
import Badge from '@/components/Badge.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Swal from 'sweetalert2'

const loading = ref(false)
const pointages = ref([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
})
const searchQuery = ref('')

const fetchPointages = async (page = 1) => {
  loading.value = true
  try {
    const params = { page, per_page: 15 }
    if (searchQuery.value) params.search = searchQuery.value
    const response = await api.get('/pointages', { params })
    pointages.value = response.data.data
    pagination.value = {
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    }
  } catch (error) {
    Swal.fire('Erreur', 'Impossible de charger les pointages', 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  fetchPointages(page)
}

const confirmReset = async () => {
  const result = await Swal.fire({
    title: 'Réinitialiser les pointages du jour ?',
    text: 'Cette action supprimera tous les pointages d\'aujourd\'hui.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Oui, réinitialiser',
    cancelButtonText: 'Annuler',
  })
  if (result.isConfirmed) {
    try {
      await api.post('/pointages/reset', { force_reset: true })
      Swal.fire('Succès', 'Pointages réinitialisés', 'success')
      fetchPointages()
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de réinitialiser', 'error')
    }
  }
}

const viewDetails = (pointage) => {
  Swal.fire({
    title: `Pointage - ${pointage.prenom} ${pointage.nom}`,
    html: `
      <div class="text-left space-y-2">
        <p><strong>IM:</strong> ${pointage.IM}</p>
        <p><strong>Entrée:</strong> <span class="${pointage.heure_entree ? 'text-green-600' : 'text-gray-400'}">${pointage.heure_entree || '--:--'}</span></p>
        <p><strong>Sortie:</strong> <span class="${pointage.heure_sortie ? 'text-blue-600' : 'text-gray-400'}">${pointage.heure_sortie || '--:--'}</span></p>
        <p><strong>Statut:</strong> ${pointage.status || 'En attente'}</p>
      </div>
    `,
    confirmButtonText: 'Fermer',
  })
}

onMounted(() => {
  fetchPointages()
})
</script>