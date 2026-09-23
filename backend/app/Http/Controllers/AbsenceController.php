<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Personnel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\AbsenceStatusMail;

class AbsenceController extends Controller
{
    // Afficher la liste des absences
    public function index()
    {
        $absences = Absence::with('personnel')->get(); // Récupère les absences avec le personnel lié
        return Inertia::render('Absence', [
            'absences' => $absences,
        ]);
    }

    // Afficher le formulaire de demande d'absence
    public function create()
    {
        $personnels = Personnel::all(); // Récupérer tous les personnels
        return Inertia::render('Demmande', [
            'personnels' => $personnels, // Passer la liste des personnels à la vue
        ]);
    }

    // Enregistrer une nouvelle absence
public function store(Request $request)
{
    
    // Créer une nouvelle absence
    $absence = Absence::create([
        'personnel_id' => $validated['personnel_id'],
        'date_debut' => $validated['date_debut'],
        'date_fin' => $validated['date_fin'],
        'annee' => $validated['annee'],
        'lieu' => $validated['lieu'],
        'motif' => $validated['motif'],
        'etat' => 'En entente', // Par défaut, l'absence est en attente
    ]);

    // Envoyer un e-mail pour informer le personnel de la demande
    Mail::to($absence->personnel->email)->send(new AbsenceStatusMail($absence));

    return redirect()->route('absence')->with('success', 'Demande d\'absence enregistrée avec succès!');
}

    // Mettre à jour le statut de l'absence
    public function updateStatus($id, Request $request)
    {
        $absence = Absence::findOrFail($id); // Trouver l'absence par ID
        $absence->update([
            'etat' => $request->status, // Mettre à jour l'état (acceptée ou refusée)
        ]);

        // Envoyer l'email pour informer du statut
        Mail::to($absence->personnel->email)->send(new AbsenceStatusMail($absence));

        return response()->json(['message' => 'Statut mis à jour avec succès!']);
    }
}
