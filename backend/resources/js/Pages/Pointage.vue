<script>
import { Head, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Pagination from '@/composables/Pagination.vue';
import Swal from 'sweetalert2';

export default {
  components: {
    AuthenticatedLayout,
    Pagination,
  },
  props: {
    personnels: Object,
  },
  data() {
    return {
      searchQuery: '',
      selectedDate: '', // Pour le filtrage par date
    };
  },
  methods: {
    search() {
      router.get(
        route('pointage.index'),
        { search: this.searchQuery, date: this.selectedDate },
        { preserveState: true }
      );
    },
    pointer(personnelId, type) {
      router.post(
        route('pointage.pointer', { personnelId, type }),
        {},
        {
          onSuccess: () => {
            Swal.fire(
              'Succès',
              `Pointage ${type} effectué avec succès!`,
              'success'
            );
          },
          onError: () => {
            Swal.fire('Erreur', `Échec du pointage ${type}`, 'error');
          },
        }
      );
    },
    resetPointage() {
      Swal.fire({
        title: 'Réinitialiser les pointages?',
        text: 'Cela supprimera tous les pointages pour aujourd\'hui.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, réinitialiser!',
      }).then((result) => {
        if (result.isConfirmed) {
          router.post(
            route('pointage.reset'),
            { force_reset: true },
            {
              onSuccess: () => {
                Swal.fire(
                  'Succès',
                  'Pointages réinitialisés pour aujourd\'hui.',
                  'success'
                );
              },
              onError: () => {
                Swal.fire(
                  'Erreur',
                  'Échec de la réinitialisation des pointages.',
                  'error'
                );
              },
            }
          );
        }
      });
    },
  },
};
</script>

<template>
  <Head title="Liste des Pointages" />

  <AuthenticatedLayout>
    <template #header>
      <h2 class="font-semibold text-xl text-gray-800 leading-tight">Liste des Personnels</h2>
    </template>

    <div class="py-12">
      <div class="container">
        <div class="card shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title mb-0">Liste des Pointages</h3>
            <button class="btn btn-outline-success" @click.prevent="resetPointage">Réinitialiser</button>
          </div>
          <div class="card-body">
            <div class="row mb-4">
              <div class="col-md-4">
                <input
                  type="text"
                  v-model="searchQuery"
                  class="form-control"
                  placeholder="Recherche par nom ou prénom"
                  @input="search"
                />
              </div>
              <div class="col-md-4">
                <input
                  type="date"
                  v-model="selectedDate"
                  class="form-control"
                  @change="search"
                />
              </div>
            </div>

            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom</th>
                  <th>Prenom</th>
                  <th>Heure d'entrée</th>
                  <th>Heure de sortie</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="personnel in personnels.data" :key="personnel.id">
                  <td>{{ personnel.IM }}</td>
                  <td>{{ personnel.nom }}</td>
                  <td>{{ personnel.prenom }}</td>
                  <td>{{ personnel.heure_entree }}</td>
                  <td>{{ personnel.heure_sortie }}</td>
                  <td>
                    <span
                      :class="personnel.status === 'En retard' ? 'badge bg-danger' : 'badge bg-success'"
                    >
                      {{ personnel.status }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn btn-sm btn-outline-success me-2"
                      @click="pointer(personnel.id, 'entree')"
                    >
                      Entrée
                    </button>
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="pointer(personnel.id, 'sortie')"
                    >
                      Sortie
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <Pagination :links="personnels.links" />
          </div>
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.table-hover tbody tr {
  line-height: 1.2;
}

.py-12 {
  margin-top: -50px;
}

.table-hover tbody tr:hover {
  background-color: #f9f9f9; /* Effet au survol */
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: #f2f2f2;
}

.badge {
  font-size: 0.9rem;
  padding: 0.4em 0.6em;
}

.card-body {
  padding: 1.5rem;
}
</style>
