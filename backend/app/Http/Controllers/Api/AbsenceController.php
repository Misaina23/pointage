<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Personnel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\AbsenceStatusMail;

class AbsenceController extends Controller
{
    public function index(Request $request)
    {
        $query = Absence::with('personnel.direction');

        if ($request->has('status')) {
            $query->where('etat', $request->status);
        }

        if ($request->has('personnel_id')) {
            $query->where('personnel_id', $request->personnel_id);
        }

        $perPage = $request->get('per_page', 15);
        $absences = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($absences);
    }

    public function store(Request $request)
    {
        // Get personnel - either from authenticated user or from request
        $personnel = $request->user();

        // If admin/security creating for someone else
        if ($request->has('personnel_id') && $request->user()->hasRole('admin')) {
            $personnel = Personnel::findOrFail($request->personnel_id);
        }

        $validator = Validator::make($request->all(), [
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'annee' => 'required|integer|min:2020|max:2030',
            'lieu' => 'required|string|max:255',
            'motif' => 'required|string',
            'personnel_id' => 'sometimes|exists:personnels,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $absence = Absence::create([
            'personnel_id' => $personnel->id,
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_fin,
            'annee' => $request->annee,
            'lieu' => $request->lieu,
            'motif' => $request->motif,
            'etat' => 'En attente',
        ]);

        // Send email notification
        try {
            Mail::to($personnel->email)->send(new AbsenceStatusMail($absence));
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error('Failed to send absence email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Demande d\'absence enregistrée avec succès!',
            'absence' => $absence->load('personnel')
        ], 201);
    }

    public function show(Absence $absence)
    {
        return response()->json($absence->load('personnel.direction'));
    }

    public function updateStatus(Request $request, Absence $absence)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:Acceptée,Refusée,En attente',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $absence->update(['etat' => $request->status]);

        try {
            Mail::to($absence->personnel->email)->send(new AbsenceStatusMail($absence));
        } catch (\Exception $e) {
            \Log::error('Failed to send absence status email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Statut mis à jour avec succès!',
            'absence' => $absence->load('personnel')
        ]);
    }

    public function myAbsences(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $absences = Absence::where('personnel_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($absences);
    }

    public function destroy(Absence $absence)
    {
        $absence->delete();
        return response()->json(['message' => 'Demande d\'absence supprimée']);
    }
}