<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Personnel; // Import du modèle Personnel
use App\Models\Direction; // Import du modèle Direction

class PersonnelController extends Controller
{
    public function index()
    {
        // Récupération des personnels avec leurs directions
        $personnels = Personnel::with('direction')->paginate(5);

        // Récupération de toutes les directions
        $directions = Direction::all();

        // Retourne une vue Inertia avec les données
        return Inertia::render('Personnel', [
            'personnels' => $personnels,
            'directions' => $directions,
        ]);
    }

    public function create()
    {
        // Récupération des directions pour le formulaire de création
        $directions = Direction::all(); // Exemple d'utilisation
        return Inertia::render('CreatePersonnel', [
            'directions' => $directions, // Si nécessaire
        ]);
    }

    public function edit($id)
    {
        // Récupération du personnel à éditer
        $personnel = Personnel::findOrFail($id);

        // Récupération de toutes les directions
        $directions = Direction::all();

        // Retourne une vue Inertia avec les données du personnel et les directions
        return Inertia::render('EditPersonnel', [
            'personnel' => $personnel,
            'directions' => $directions,
        ]);
    }

    public function update(Request $request, $id)
    {
        // Validation des données
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'direction_id' => 'required|exists:directions,id',
            'service' => 'required|string|max:255',
            'grade' => 'required|string|max:255',
            'corp' => 'required|string|max:255',
            'fonction' => 'required|string|max:255',
            'IM' => 'required|string|max:255',
            'email' => 'required|email|unique:personnels,email,' . $id, // Exclure l'email de l'enregistrement actuel
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // Si vous utilisez une image
        ]);

        // Recherche du personnel à mettre à jour
        $personnel = Personnel::findOrFail($id);

        // Si une photo a été envoyée, on la télécharge et on met à jour le chemin
        $photoPath = $personnel->photo; // Conserver la photo actuelle si aucune nouvelle photo n'est envoyée
        if ($request->hasFile('photo')) {
            // Supprimer l'ancienne photo si elle existe
            if ($photoPath) {
                \Storage::delete('public/' . $photoPath);
            }
            // Stocker la nouvelle photo
            $photoPath = $request->file('photo')->store('photos', 'public');
        }

        // Mise à jour des données du personnel
        $personnel->update([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'direction_id' => $request->direction_id,
            'service' => $request->service,
            'grade' => $request->grade,
            'corp' => $request->corp,
            'fonction' => $request->fonction,
            'IM' => $request->IM,
            'email' => $request->email,
            'photo' => $photoPath, // Mettre à jour le chemin de la photo
        ]);

        // Redirection vers la liste des personnels avec un message de succès
        return redirect()->route('personnel');
    }

    public function destroy($id)
    {
        // Recherche et suppression de la direction
        $personnel = Personnel::findOrFail($id);
        $personnel->delete();

        // Redirection avec un message flash
        return redirect()->route('personnel');
    }

    public function store(Request $request)
    {
        // Validation des données
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'direction_id' => 'required|exists:directions,id',
            'service' => 'required|string|max:255',
            'grade' => 'required|string|max:255',
            'corp' => 'required|string|max:255',
            'fonction' => 'required|string|max:255',
            'IM' => 'required|string|max:255',
            'email' => 'required|email|unique:personnels,email',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // Si vous utilisez une image
        ]);

        // Si une photo a été envoyée, on la télécharge
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('photos', 'public');
        }

        // Création d'un nouveau personnel
        Personnel::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'direction_id' => $request->direction_id,
            'service' => $request->service,
            'grade' => $request->grade,
            'corp' => $request->corp,
            'fonction' => $request->fonction,
            'IM' => $request->IM,
            'email' => $request->email,
            'photo' => $photoPath, // Enregistrer le chemin de la photo
        ]);

        // Redirection vers la liste des personnels avec message de succès
        return redirect()->route('personnel');
    }
}