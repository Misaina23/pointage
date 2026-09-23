<template>
  <Head title="Liste des absences" />

  <AuthenticatedLayout>
    <template #header>
      <h2 class="font-semibold text-xl text-gray-800 leading-tight">Liste des Personnels</h2>
    </template>

    <div class="py-12">
      <div class="container">
        <div class="card shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title mb-0">Liste des Demandes</h3>
            <Link :href="route('absence.create')" class="btn btn-outline-success">
              <i class="fa fa-plus me-2"></i> Nouvelle demande
            </Link>
          </div>

          <!-- Table des absences -->
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Date de demande</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>Titre de l'année</th>
                <th>Lieu</th>
                <th>Motif</th>
                <th>État</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <!-- Vérification de l'existence des données avant d'afficher -->
              <tr v-if="personnels && personnels.data && personnels.data.length > 0" v-for="personnel in personnels.data" :key="personnel.id">
                <td>{{ personnel.matricule }}</td>
                <td>{{ personnel.date_demande }}</td>
                <td>{{ personnel.date_debut }}</td>
                <td>{{ personnel.date_fin }}</td>
                <td>{{ personnel.titre_annee }}</td>
                <td>{{ personnel.lieu }}</td>
                <td>{{ personnel.motif }}</td>
                <td>
                  <span
                    :class="personnel.etat === 'En attente' ? 'badge bg-warning' : personnel.etat === 'acceptée' ? 'badge bg-success' : 'badge bg-danger'"
                  >
                    {{ personnel.etat }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-outline-success me-2"
                    v-if="personnel.etat === 'En attente'"
                    @click="handleStatusChange(personnel.id, 'acceptée')"
                  >
                    Accepter
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    v-if="personnel.etat === 'En attente'"
                    @click="handleStatusChange(personnel.id, 'refusée')"
                  >
                    Refuser
                  </button>
                </td>
              </tr>
              <!-- Message si aucune donnée n'est disponible -->
              <tr v-else>
                <td colspan="9" class="text-center">Aucune donnée disponible</td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination des résultats -->
          <Pagination :links="personnels.links" />
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<script>
import { Head, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Pagination from '@/composables/Pagination.vue';
import Swal from 'sweetalert2';
import axios from 'axios';

export default {
  components: {
    AuthenticatedLayout,
    Pagination,
  },
  props: {
    personnels: {
      type: Object,
      default: () => ({ data: [], links: [] }), // Valeur par défaut vide pour éviter erreurs
    },
  },
  methods: {
    async handleStatusChange(id, status) {
      try {
        const response = await axios.post(route('absence.update-status', id), {
          status,
        });
        Swal.fire({
          title: 'Succès',
          text: `Demande ${status === 'acceptée' ? 'acceptée' : 'refusée'} avec succès.`,
          icon: 'success',
          confirmButtonText: 'OK',
        });
        router.reload(); // Recharge les données pour refléter la mise à jour
      } catch (error) {
        Swal.fire({
          title: 'Erreur',
          text: "Une erreur s'est produite lors de la mise à jour.",
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    },
  },
};
</script>

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

.badge {
  font-size: 0.9rem;
  padding: 0.4em 0.6em;
}

.card-body {
  padding: 1.5rem;
}

.text-center {
  text-align: center;
}
</style>
