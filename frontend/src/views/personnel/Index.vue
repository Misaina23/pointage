<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestion du personnel</h1>
        <p class="text-gray-600 mt-1">Liste de tous les employés</p>
      </div>
      <router-link to="/personnel/create" class="btn-primary">
        <PlusIcon class="w-5 h-5 mr-2" />
        Nouveau personnel
      </router-link>
    </div>

    <!-- Search and Filters -->
    <Card title="Recherche et filtres" icon="MagnifyingGlassIcon">
      <form @submit.prevent="fetchPersonnels" class="flex flex-col sm:flex-row gap-4">
        <Input
          v-model="searchQuery"
          id="search"
          name="search"
          placeholder="Rechercher par nom, prénom, IM, email..."
          prependIcon="MagnifyingGlassIcon"
          class="flex-1"
        />
        <Button type="submit" variant="primary">
          Rechercher
        </Button>
        <Button type="button" variant="secondary" @click="clearSearch">
          Réinitialiser
        </Button>
      </form>
    </Card>

    <!-- Personnel Table -->
    <Card title="" icon="UsersIcon">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="h-10 w-10" />
      </div>

      <div v-else-if="personnels.length === 0" class="text-center py-12 text-gray-500">
        <UsersIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p class="text-lg">Aucun personnel trouvé</p>
        <router-link to="/personnel/create" class="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
          Créer le premier personnel
        </router-link>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full" role="table">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service / Grade</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IM</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="personnel in personnels" :key="personnel.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span v-if="personnel.photo" class="text-blue-700 font-medium text-sm">
                      {{ personnel.prenom?.charAt(0) }}{{ personnel.nom?.charAt(0) }}
                    </span>
                    <img v-else :src="personnel.photo" :alt="personnel.nom" class="w-10 h-10 rounded-full object-cover" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ personnel.prenom }} {{ personnel.nom }}</p>
                    <p class="text-sm text-gray-500">{{ personnel.fonction }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-gray-900">{{ personnel.direction?.nom || '-' }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-gray-900">{{ personnel.service }}</p>
                <p class="text-sm text-gray-500">{{ personnel.grade }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm text-gray-900">{{ personnel.IM }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-gray-900">{{ personnel.email }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge :variant="personnel.role === 'security' ? 'warning' : 'primary'">
                  {{ personnel.role === 'security' ? 'Sécurité' : 'Employé' }}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link :to="`/personnel/${personnel.id}/edit`" class="text-blue-600 hover:text-blue-900 mr-3">
                  Modifier
                </router-link>
                <button
                  @click="confirmDelete(personnel)"
                  class="text-red-600 hover:text-red-900"
                >
                  Supprimer
                </button>
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
import { useRouter } from 'vue-router'
import { usePersonnelStore } from '@/stores/personnel'
import { PlusIcon, UsersIcon, MagnifyingGlassIcon } from '@/components'
import Card from '@/components/Card.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Pagination from '@/components/Pagination.vue'
import Badge from '@/components/Badge.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const personnelStore = usePersonnelStore()

const searchQuery = ref('')
const loading = ref(false)
const personnels = ref([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
})

const fetchPersonnels = async (page = 1) => {
  loading.value = true
  try {
    const params = { page, per_page: 15 }
    if (searchQuery.value) params.search = searchQuery.value

    const response = await personnelStore.fetchPersonnels(params)
    personnels.value = response.data
    pagination.value = {
      current_page: response.current_page,
      last_page: response.last_page,
      per_page: response.per_page,
      total: response.total,
    }
  } catch (error) {
    console.error('Failed to fetch personnels:', error)
    Swal.fire('Erreur', 'Impossible de charger le personnel', 'error')
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  fetchPersonnels(1)
}

const changePage = (page) => {
  fetchPersonnels(page)
}

const confirmDelete = async (personnel) => {
  const result = await Swal.fire({
    title: 'Supprimer ce personnel ?',
    text: `Cette action supprimera définitivement ${personnel.prenom} ${personnel.nom}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
  })

  if (result.isConfirmed) {
    try {
      await personnelStore.deletePersonnel(personnel.id)
      Swal.fire('Supprimé', 'Le personnel a été supprimé avec succès', 'success')
      fetchPersonnels(pagination.value.current_page)
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de supprimer le personnel', 'error')
    }
  }
}

onMounted(() => {
  fetchPersonnels()
})
</script>