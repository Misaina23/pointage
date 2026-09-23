<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Personnel;
use App\Models\Pointage;


class PointageController extends Controller
{
    // Display the pointage list
    public function index(Request $request)
{
    $query = Personnel::with(['pointage' => function ($query) {
        $query->where('date', now()->toDateString());
    }]);

    // Filtrage par recherche si une valeur est fournie
    if ($request->search) {
        $query->where('nom', 'like', '%' . $request->search . '%');
    }

    // Paginer les résultats
    $personnels = $query->paginate(5);

    // Ajouter les données de pointage pour chaque personnel
    $personnels->getCollection()->transform(function ($personnel) {
        $pointage = $personnel->pointage->first();
        return [
            'id' => $personnel->id,
            'IM' => $personnel->IM,
            'nom' => $personnel->nom,
            'prenom' => $personnel->prenom,
            'heure_entree' => $pointage->heure_entree ?? ' ',
            'heure_sortie' => $pointage->heure_sortie ?? ' ',
            'status' => $pointage->status ?? '',
        ];
    });

    // Retourner la vue avec les données
    return Inertia::render('Pointage', [
        'personnels' => $personnels,
    ]);
}


    // Handle pointage for entry or exit
    public function pointer(Request $request, $personnelId, $type)
    {
        $pointage = Pointage::firstOrNew([
            'personnel_id' => $personnelId,
            'date' => now()->toDateString(),
        ]);
    
        // Empêcher les doublons
        if (($type === 'entree' && $pointage->heure_entree) || ($type === 'sortie' && $pointage->heure_sortie)) {
            return response()->json(['message' => "Le personnel a déjà pointé pour $type."], 400);
        }
    
        // Vérifier si une sortie est possible sans entrée
        if ($type === 'sortie' && !$pointage->heure_entree) {
            return response()->json(['message' => "Impossible de pointer sortie sans pointer entrée."], 400);
        }
    
        // Enregistrer l'heure de pointage
        if ($type === 'entree') {
            $pointage->heure_entree = now()->toTimeString();
    
            // Déterminer le statut uniquement pour l'entrée
            $scheduledTime = '08:00:00'; // Heure programmée
            $pointage->status = $pointage->heure_entree > $scheduledTime ? 'En retard' : 'À l\'heure';
        } elseif ($type === 'sortie') {
            $pointage->heure_sortie = now()->toTimeString();
        }
    
        $pointage->save();
    
        return redirect()->route('pointage');
    }
    
    public function resetPointage(Request $request)
{
    $today = now()->toDateString();

    // Vérifier si c'est un jour différent pour réinitialisation automatique
    $lastReset = cache()->get('last_reset_date');
    if ($lastReset !== $today) {
        // Mettre à jour la date de la dernière réinitialisation
        cache()->put('last_reset_date', $today);
    }

    // Si la réinitialisation est demandée pour aujourd'hui, supprimer les pointages
    if ($request->input('force_reset', false)) {
        Pointage::where('date', $today)->delete();
        return redirect()->route('pointage');
    }

    return response()->json(['message' => 'Aucune action effectuée.']);

}

protected function schedule(Schedule $schedule)
{
    $schedule->call(function () {
        Pointage::where('date', now()->toDateString())->delete();
    })->dailyAt('00:00'); // Réinitialisation tous les jours à minuit
}


}
