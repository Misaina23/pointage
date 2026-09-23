// useAlert.js
import { ref } from 'vue';
import Swal from 'sweetalert2';

export function useAlert() {
    const message = ref('');
    const type = ref('');

    // Fonction pour afficher l'alerte avec SweetAlert2
    const showAlert = (msg, alertType) => {
        message.value = msg;
        type.value = alertType;

        // Utilisation de SweetAlert2 pour afficher l'alerte
        Swal.fire({
            title: alertType === 'success' ? 'Succès' : 'Erreur',
            text: msg,
            icon: alertType === 'success' ? 'success' : 'error',
            confirmButtonText: 'D\'accord',
        });
    };

    // Fonction pour fermer l'alerte (non nécessaire si vous utilisez SweetAlert2)
    const closeAlert = () => {
        message.value = '';
        type.value = '';
    };

    return {
        message,
        type,
        showAlert,
        closeAlert
    };
}
