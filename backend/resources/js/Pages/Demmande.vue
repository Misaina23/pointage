<template>
    <Head title="Demande d'Absence" />
    <AuthenticatedLayout>
      <template #header>
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Faire une Demande d'Absence</h2>
      </template>
  
      <div class="py-5">
        <div class="container">
          <div class="card shadow-sm">
            <div class="card-header">
              <h3 class="card-title mb-0">Formulaire de Demande</h3>
            </div>
  
            <div class="card-body">
              <form @submit.prevent="submitForm">
                <div class="mb-3">
                  <label for="personnel_id" class="form-label">Personnel</label>
                  <select v-model="form.personnel_id" class="form-control" required>
                    <option value="">Sélectionner un personnel</option>
                    <option v-for="personnel in personnels" :key="personnel.id" :value="personnel.id">
                      {{ personnel.IM }} - {{ personnel.nom }}
                    </option>
                  </select>
                </div>
  
                <div class="mb-3">
                  <label for="date_debut" class="form-label">Date de début</label>
                  <input v-model="form.date_debut" type="date" class="form-control" required />
                </div>
  
                <div class="mb-3">
                  <label for="date_fin" class="form-label">Date de fin</label>
                  <input v-model="form.date_fin" type="date" class="form-control" required />
                </div>
  
                <div class="mb-3">
                  <label for="motif" class="form-label">Motif</label>
                  <textarea v-model="form.motif" class="form-control" rows="3" required></textarea>
                </div>
  
                <div class="mb-3">
                  <label for="lieu" class="form-label">Lieu (optionnel)</label>
                  <input v-model="form.lieu" type="text" class="form-control" />
                </div>
  
                <div class="mb-3">
                  <button type="submit" class="btn btn-success">Soumettre la demande</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { Inertia } from '@inertiajs/inertia';
  import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
  
  export default {
    components: {
      AuthenticatedLayout,
    },
    props: {
      personnels: Array, // Liste des personnels à partir du contrôleur
    },
    setup() {
      const form = ref({
        personnel_id: '',
        date_debut: '',
        date_fin: '',
        motif: '',
        lieu: '',
      });
  
      // Fonction pour soumettre le formulaire
      const submitForm = () => {
        Inertia.post(route('absence.store'), form.value, {
          onSuccess: () => {
            // Reset du formulaire après la soumission
            form.value = {
              personnel_id: '',
              date_debut: '',
              date_fin: '',
              motif: '',
              lieu: '',
            };
          },
        });
      };
  
      return { form, submitForm };
    },
  };
  </script>
  <style>

.py-5 {
    margin-top: -50px;
    width: 750px;
    margin-left: auto;
    margin-right: auto;
}

  </style>
  