<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Horloge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HorlogeController extends Controller
{
    public function index()
    {
        $horloges = Horloge::orderBy('heure_arrivee', 'ASC')->get();
        return response()->json($horloges);
    }

    public function update(Request $request, Horloge $horloge)
    {
        $validator = Validator::make($request->all(), [
            'heure_arrivee' => 'sometimes|date_format:H:i',
            'heure_depart' => 'sometimes|date_format:H:i|after:heure_arrivee',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $horloge->update([
            'heure_arrivee' => $request->heure_arrivee ?? $horloge->heure_arrivee,
            'heure_depart' => $request->heure_depart ?? $horloge->heure_depart,
        ]);

        return response()->json($horloge);
    }
}