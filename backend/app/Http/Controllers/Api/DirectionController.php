<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Direction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DirectionController extends Controller
{
    public function index()
    {
        $directions = Direction::orderBy('nom', 'ASC')->get();
        return response()->json($directions);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'description' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $direction = Direction::create([
            'nom' => $request->nom,
            'description' => $request->description,
        ]);

        return response()->json($direction, 201);
    }

    public function show(Direction $direction)
    {
        return response()->json($direction);
    }

    public function update(Request $request, Direction $direction)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $direction->update([
            'nom' => $request->nom ?? $direction->nom,
            'description' => $request->description ?? $direction->description,
        ]);

        return response()->json($direction);
    }

    public function destroy(Direction $direction)
    {
        $direction->delete();
        return response()->json(['message' => 'Direction supprimée avec succès']);
    }
}