<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Badges QR Code</h1>
        <p class="text-gray-600 mt-1">Génération et impression des badges QR du personnel</p>
      </div>
    </div>

    <!-- Search -->
    <Card title="Recherche" icon="MagnifyingGlassIcon">
      <form @submit.prevent="fetchBadges" class="flex flex-col sm:flex-row gap-4">
        <Input
          v-model="searchQuery"
          id="search"
          name="search"
          placeholder="Rechercher par nom, IM, email..."
          prependIcon="MagnifyingGlassIcon"
          class="flex-1"
        />
        <Button type="submit" variant="primary">Rechercher</Button>
        <Button type="button" variant="secondary" @click="clearSearch">Réinitialiser</Button>
      </form>
    </Card>

    <Card title="Badges QR" icon="QrCodeIcon">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="h-10 w-10" />
      </div>

      <div v-else-if="personnels.length === 0" class="text-center py-12">
        <QrCodeIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p class="text-lg text-gray-500">Aucun personnel trouvé</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="personnel in personnels" :key="personnel.id" class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div class="text-center mb-4">
            <div v-if="personnel.photo" class="w-20 h-20 mx-auto mb-3 bg-gray-100 rounded-full overflow-hidden relative">
              <img :src="getPhotoUrl(personnel.photo)" :alt="personnel.nom" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-20 h-20 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-700 font-medium text-2xl">{{ personnel.prenom?.charAt(0) }}{{ personnel.nom?.charAt(0) }}</span>
            </div>
            <h3 class="font-semibold text-gray-900">{{ personnel.prenom }} {{ personnel.nom }}</h3>
            <p class="text-sm text-gray-500">{{ personnel.IM }}</p>
            <p class="text-xs text-gray-400">{{ personnel.direction?.nom }}</p>
          </div>

          <!-- QR Code Preview -->
          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div v-if="qrCodes[personnel.id]" class="w-48 h-48 mx-auto" v-html="qrCodes[personnel.id]"></div>
            <div v-else class="w-48 h-48 mx-auto flex items-center justify-center">
              <LoadingSpinner class="text-gray-400" />
            </div>
          </div>

          <div class="space-y-2">
            <Button variant="primary" class="w-full" @click="downloadBadge(personnel)">
              <DownloadIcon class="w-4 h-4 mr-2" />
              Télécharger PNG
            </Button>
            <Button variant="secondary" class="w-full" @click="printBadge(personnel)">
              <PrinterIcon class="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="ghost" class="w-full" @click="viewBadge(personnel)">
              <EyeIcon class="w-4 h-4 mr-2" />
              Voir en grand
            </Button>
          </div>
        </div>
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

    <!-- Modal for full-size QR -->
    <Modal v-model:modelValue="showQrModal" :title="'Badge QR - '+selectedPersonnel?.prenom+' '+selectedPersonnel?.nom" size="lg">
      <div v-if="selectedPersonnel" class="text-center space-y-6">
        <div class="w-64 h-64 mx-auto" v-html="qrCodes[selectedPersonnel.id]"></div>
        <div class="space-y-2 text-gray-600">
          <p class="font-medium text-lg">{{ selectedPersonnel.prenom }} {{ selectedPersonnel.nom }}</p>
          <p>{{ selectedPersonnel.IM }}</p>
          <p>{{ selectedPersonnel.direction?.nom }}</p>
          <p class="text-sm text-gray-400 font-mono">{{ selectedPersonnel.qr_code }}</p>
        </div>
        <div class="flex gap-3 justify-center pt-4 border-t border-gray-200">
          <Button variant="primary" @click="downloadBadge(selectedPersonnel)">
            <DownloadIcon class="w-4 h-4 mr-2" />
            Télécharger
          </Button>
          <Button variant="secondary" @click="printBadge(selectedPersonnel)">
            <PrinterIcon class="w-4 h-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import { QrCodeIcon, MagnifyingGlassIcon, DownloadIcon, PrinterIcon, EyeIcon } from '@/components'
import Card from '@/components/Card.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Pagination from '@/components/Pagination.vue'
import Modal from '@/components/Modal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Swal from 'sweetalert2'

const loading = ref(false)
const personnels = ref([])
const qrCodes = ref({})
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
})
const searchQuery = ref('')
const showQrModal = ref(false)
const selectedPersonnel = ref(null)

const fetchBadges = async (page = 1) => {
  loading.value = true
  try {
    const params = { page, per_page: 12 }
    if (searchQuery.value) params.search = searchQuery.value
    const response = await api.get('/personnel', { params })
    personnels.value = response.data.data
    pagination.value = {
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    }
    // Fetch QR codes for each personnel
    await fetchQrCodes()
  } catch (error) {
    Swal.fire('Erreur', 'Impossible de charger les badges', 'error')
  } finally {
    loading.value = false
  }
}

const fetchQrCodes = async () => {
  for (const personnel of personnels.value) {
    try {
      const response = await api.get(`/badge/${personnel.id}`)
      qrCodes.value[personnel.id] = response.data
    } catch (error) {
      console.error('Failed to fetch QR for', personnel.id, error)
    }
  }
}

const changePage = (page) => {
  fetchBadges(page)
}

const clearSearch = () => {
  searchQuery.value = ''
  fetchBadges(1)
}

const getPhotoUrl = (photo) => {
  if (!photo) return ''
  return `${api.defaults.baseURL.replace('/api', '')}/storage/${photo}`
}

const downloadBadge = async (personnel) => {
  try {
    const response = await api.get(`/badge/${personnel.id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `badge-${personnel.qr_code}.png`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    Swal.fire('Erreur', 'Impossible de télécharger le badge', 'error')
  }
}

const printBadge = (personnel) => {
  const printWindow = window.open('', '_blank')
  const qrHtml = qrCodes.value[personnel.id] || ''
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Badge - ${personnel.prenom} ${personnel.nom}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        .badge { max-width: 400px; margin: 0 auto; }
        .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px; }
        .qr { margin: 20px 0; }
        .info { margin-top: 20px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="badge">
        ${personnel.photo ? `<img src="${getPhotoUrl(personnel.photo)}" class="photo" alt="${personnel.nom}" />` : ''}
        <h2>${personnel.prenom} ${personnel.nom}</h2>
        <p><strong>IM:</strong> ${personnel.IM}</p>
        <p><strong>Direction:</strong> ${personnel.direction?.nom}</p>
        <p><strong>QR Code:</strong> ${personnel.qr_code}</p>
        <div class="qr">${qrHtml}</div>
        <div class="info no-print">
          <button onclick="window.print()">Imprimer</button>
          <button onclick="window.close()">Fermer</button>
        </div>
      </div>
    </body>
    </html>
  `)
  printWindow.document.close()
}

const viewBadge = (personnel) => {
  selectedPersonnel.value = personnel
  showQrModal.value = true
}

onMounted(() => {
  fetchBadges()
})
</script>