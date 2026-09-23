<?php 

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Horloge;  // Assurez-vous d'utiliser le modèle correct
use Inertia\Inertia;

class HorlogeController extends Controller
{
    // Affichage de la liste des horaires
    public function index()
    {
        $horloges = Horloge::orderBy('heure_arrivee', 'ASC')->get();  // Trier par heure d'arrivée
        
        return Inertia::render('Horloge', [
            'horloges' => $horloges,
        ]);
    }

    // Mise à jour d'un horaire existant
    public function update(Request $request, $id)
    {
        // Validation des données
      
        
        // Recherche et mise à jour de l'horaire
        $horloge = Horloge::findOrFail($id);
        $horloge->update([
            'heure_arrivee' => $request->heure_arrivee,
            'heure_depart' => $request->heure_depart,
        ]);

        // Redirection avec un message flash
        return redirect()->route('horloge');
    }

}
