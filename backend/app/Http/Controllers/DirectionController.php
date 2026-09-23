<?php 

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Direction;
use Inertia\Inertia;

class DirectionController extends Controller
{
    // Affichage de la liste des directions
    public function index()
    {
        $directions = Direction::orderBy('nom', 'ASC')->get();
        
        return Inertia::render('Direction', [
            'directions' => $directions,
        ]);
    }

    // Création d'une nouvelle direction
    public function store(Request $request)
    {
        // Validation des données
        $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'required|string|max:255',
        ]);

        // Création de la direction
        Direction::create([
            'nom' => $request->nom,
            'description' => $request->description,
        ]);

        // Redirection avec un message flash
        return redirect()->route('direction');
    }

    // Mise à jour d'une direction existante
    public function update(Request $request, $id)
    {
        // Validation des données
        $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'required|string|max:255',
        ]);

        // Recherche et mise à jour de la direction
        $direction = Direction::findOrFail($id);
        $direction->update([
            'nom' => $request->nom,
            'description' => $request->description,
        ]);

        // Redirection avec un message flash
        return redirect()->route('direction');
    }

    // Suppression d'une direction
    public function destroy($id)
    {
        // Recherche et suppression de la direction
        $direction = Direction::findOrFail($id);
        $direction->delete();

        // Redirection avec un message flash
        return redirect()->route('direction');
    }
}
