<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personnel;
use App\Models\Pointage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PointageController extends Controller
{
    public function index(Request $request)
    {
        $query = Personnel::with(['pointage' => function ($q) {
            $q->where('date', now()->toDateString());
        }]);

        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('prenom', 'like', '%' . $request->search . '%')
                  ->orWhere('IM', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->get('per_page', 15);
        $personnels = $query->paginate($perPage);

        $personnels->getCollection()->transform(function ($personnel) {
            $pointage = $personnel->pointage->first();
            return [
                'id' => $personnel->id,
                'IM' => $personnel->IM,
                'nom' => $personnel->nom,
                'prenom' => $personnel->prenom,
                'heure_entree' => $pointage->heure_entree ?? null,
                'heure_sortie' => $pointage->heure_sortie ?? null,
                'status' => $pointage->status ?? null,
            ];
        });

        return response()->json($personnels);
    }

    // Mobile scan endpoint - personnel scans their badge
    public function pointer(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'qr_code' => 'required|string',
            'type' => 'required|in:entree,sortie',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $personnel = Personnel::where('qr_code', $request->qr_code)->first();

        if (!$personnel) {
            return response()->json(['message' => 'Badge invalide ou personnel non trouvé.'], 404);
        }

        $pointage = Pointage::firstOrNew([
            'personnel_id' => $personnel->id,
            'date' => now()->toDateString(),
        ]);

        // Prevent duplicates
        if (($request->type === 'entree' && $pointage->heure_entree) ||
            ($request->type === 'sortie' && $pointage->heure_sortie)) {
            return response()->json([
                'message' => "Le personnel a déjà pointé pour {$request->type}.",
                'pointage' => $pointage
            ], 400);
        }

        // Check if sortie is possible without entree
        if ($request->type === 'sortie' && !$pointage->heure_entree) {
            return response()->json([
                'message' => 'Impossible de pointer sortie sans avoir pointé entrée.'
            ], 400);
        }

        // Record the pointage time
        if ($request->type === 'entree') {
            $pointage->heure_entree = now()->toTimeString();

            // Determine status for entree only
            $scheduledTime = '08:00:00';
            $pointage->status = $pointage->heure_entree > $scheduledTime ? 'En retard' : 'À l\'heure';
        } elseif ($request->type === 'sortie') {
            $pointage->heure_sortie = now()->toTimeString();
        }

        $pointage->save();

        return response()->json([
            'message' => "Pointage {$request->type} enregistré avec succès",
            'pointage' => $pointage->load('personnel')
        ]);
    }

    // Security scans employee badge
    public function scan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'qr_code' => 'required|string',
            'type' => 'required|in:entree,sortie',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify the security personnel
        $security = $request->user();
        if ($security->role !== 'security') {
            return response()->json(['message' => 'Accès non autorisé. Rôle sécurité requis.'], 403);
        }

        $personnel = Personnel::where('qr_code', $request->qr_code)->first();

        if (!$personnel) {
            return response()->json(['message' => 'Badge invalide ou personnel non trouvé.'], 404);
        }

        $pointage = Pointage::firstOrNew([
            'personnel_id' => $personnel->id,
            'date' => now()->toDateString(),
        ]);

        // Prevent duplicates
        if (($request->type === 'entree' && $pointage->heure_entree) ||
            ($request->type === 'sortie' && $pointage->heure_sortie)) {
            return response()->json([
                'message' => "Le personnel a déjà pointé pour {$request->type}.",
                'pointage' => $pointage
            ], 400);
        }

        // Check if sortie is possible without entree
        if ($request->type === 'sortie' && !$pointage->heure_entree) {
            return response()->json([
                'message' => 'Impossible de pointer sortie sans avoir pointé entrée.'
            ], 400);
        }

        // Record the pointage time
        if ($request->type === 'entree') {
            $pointage->heure_entree = now()->toTimeString();
            $scheduledTime = '08:00:00';
            $pointage->status = $pointage->heure_entree > $scheduledTime ? 'En retard' : 'À l\'heure';
        } elseif ($request->type === 'sortie') {
            $pointage->heure_sortie = now()->toTimeString();
        }

        $pointage->save();

        return response()->json([
            'message' => "Pointage {$request->type} enregistré par la sécurité pour {$personnel->prenom} {$personnel->nom}",
            'personnel' => $personnel,
            'pointage' => $pointage
        ]);
    }

    public function resetPointage(Request $request)
    {
        $today = now()->toDateString();
        $lastReset = cache()->get('last_reset_date');

        if ($lastReset !== $today) {
            cache()->put('last_reset_date', $today);
        }

        if ($request->input('force_reset', false)) {
            Pointage::where('date', $today)->delete();
            return response()->json(['message' => 'Pointages du jour réinitialisés']);
        }

        return response()->json(['message' => 'Aucune action effectuée.']);
    }
}