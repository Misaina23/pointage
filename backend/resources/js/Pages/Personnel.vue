<script setup>
import { ref, watch } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Pagination from '@/composables/Pagination.vue';
import { Link } from '@inertiajs/vue3';

const props = defineProps({
  personnels: Object,
  directions: Array,
});

// Références pour les filtres et la recherche
const searchQuery = ref('');
const selectedDirection = ref('');

// Supprimer un personnel avec confirmation
const deletePersonnel = (id) => {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: 'Cette action est irréversible.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer !',
    cancelButtonText: 'Annuler',
  }).then((result) => {
    if (result.isConfirmed) {
      router.delete(route('personnel.destroy', id), {
        onSuccess: () => {
          Swal.fire('Supprimé!', 'Le personnel a été supprimé avec succès.', 'success');
        },
        onError: () => {
          Swal.fire('Erreur!', 'Une erreur est survenue lors de la suppression.', 'error');
        },
      });
    }
  });
};

// Watchers pour gérer les filtres et la recherche
const updateResults = () => {
  router.get(route('personnel.index'), {
    search: searchQuery.value,
    direction: selectedDirection.value,
  }, {
    preserveScroll: true,
    preserveState: true,
  });
};

watch([searchQuery, selectedDirection], updateResults);
</script>

<template>
  <Head title="Liste des Personnels" />

  <AuthenticatedLayout>
    <template #header>
      <h2 class="font-semibold text-xl text-gray-800 leading-tight">Liste des Personnels</h2>
    </template>

    <div class="py-12">
      <div class="container">
        <div class="card shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title mb-0">Liste des Personnels</h3>
            <Link :href="route('personnel.create')" class="btn btn-outline-success">
              <i class="fa fa-plus me-2"></i> Nouveau
            </Link>
          </div>
          <div class="card-body">
            <div class="row mb-4">
              <!-- Barre de recherche -->
              <div class="col-md-4 mb-2 mb-md-0">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    v-model="searchQuery"
                    class="form-control"
                    placeholder="Recherche par nom ou prénom"
                  />
                </div>
              </div>

              <!-- Filtrer par direction -->
              <div class="col-md-4 mb-2 mb-md-0">
                <select v-model="selectedDirection" class="form-select">
                  <option value="">Filtrer par direction</option>
                  <option v-for="direction in directions" :key="direction.id" :value="direction.id">
                    {{ direction.nom }}
                  </option>
                </select>
              </div>

              <!-- Pagination -->
              <div class="col-md-4 d-flex justify-content-end">
                <Pagination :links="personnels.links" />
              </div>
            </div>

            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Photo</th> <!-- Nouvelle colonne pour la photo -->
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Direction</th>
                  <th>Fonction</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="personnel in personnels.data" :key="personnel.id">
                  <td>
                    <!-- Affichage de la photo, si elle existe -->
                    <img v-if="personnel.photo" :src="'/storage/' + personnel.photo" class="img-thumbnail rounded-circle" width="50" height="50" />
                    <span v-else>Pas de photo</span>
                  </td>
                  <td>{{ personnel.nom }}</td>
                  <td>{{ personnel.prenom }}</td>
                  <td>{{ personnel.direction.nom }}</td>
                  <td>{{ personnel.fonction }}</td>
                  <td>{{ personnel.email }}</td>
                  <td>
                    <Link :href="route('personnel.edit', personnel.id)" class="btn btn-outline-success btn-sm me-2">
                      <i class="fa fa-pencil-alt"></i>
                    </Link>
                    <button class="btn btn-outline-primary btn-sm" @click="deletePersonnel(personnel.id)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.pagination {
  margin: 0;
}

.btn {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

/* Style pour l'image dans le tableau */
img.img-thumbnail {
  object-fit: cover;
}
</style>
