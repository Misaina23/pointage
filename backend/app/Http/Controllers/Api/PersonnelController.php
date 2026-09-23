<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personnel;
use App\Models\Direction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PersonnelController extends Controller
{
    public function index(Request $request)
    {
        $query = Personnel::with('direction');

        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('prenom', 'like', '%' . $request->search . '%')
                  ->orWhere('IM', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->get('per_page', 15);
        $personnels = $query->paginate($perPage);

        return response()->json($personnels);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'direction_id' => 'required|exists:directions,id',
            'service' => 'required|string|max:255',
            'grade' => 'required|string|max:255',
            'corp' => 'required|string|max:255',
            'fonction' => 'required|string|max:255',
            'IM' => 'required|string|max:255|unique:personnels,IM',
            'email' => 'required|email|unique:personnels,email',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('photos', 'public');
        }

        // Generate unique QR code identifier
        $qrCode = 'PERS-' . strtoupper(Str::random(10));

        $personnel = Personnel::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'direction_id' => $request->direction_id,
            'service' => $request->service,
            'grade' => $request->grade,
            'corp' => $request->corp,
            'fonction' => $request->fonction,
            'IM' => $request->IM,
            'email' => $request->email,
            'photo' => $photoPath,
            'password' => bcrypt($request->password),
            'qr_code' => $qrCode,
            'role' => 'employee', // employee or security
        ]);

        $token = $personnel->createToken('mobile-token')->plainTextToken;

        return response()->json([
            'personnel' => $personnel->load('direction'),
            'token' => $token,
        ], 201);
    }

    public function show(Personnel $personnel)
    {
        return response()->json($personnel->load('direction'));
    }

    public function update(Request $request, Personnel $personnel)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'direction_id' => 'sometimes|exists:directions,id',
            'service' => 'sometimes|string|max:255',
            'grade' => 'sometimes|string|max:255',
            'corp' => 'sometimes|string|max:255',
            'fonction' => 'sometimes|string|max:255',
            'IM' => 'sometimes|string|max:255|unique:personnels,IM,' . $personnel->id,
            'email' => 'sometimes|email|unique:personnels,email,' . $personnel->id,
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'role' => 'sometimes|in:employee,security',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $photoPath = $personnel->photo;
        if ($request->hasFile('photo')) {
            if ($photoPath) {
                Storage::delete('public/' . $photoPath);
            }
            $photoPath = $request->file('photo')->store('photos', 'public');
        }

        $personnel->update([
            'nom' => $request->nom ?? $personnel->nom,
            'prenom' => $request->prenom ?? $personnel->prenom,
            'direction_id' => $request->direction_id ?? $personnel->direction_id,
            'service' => $request->service ?? $personnel->service,
            'grade' => $request->grade ?? $personnel->grade,
            'corp' => $request->corp ?? $personnel->corp,
            'fonction' => $request->fonction ?? $personnel->fonction,
            'IM' => $request->IM ?? $personnel->IM,
            'email' => $request->email ?? $personnel->email,
            'photo' => $photoPath,
            'role' => $request->role ?? $personnel->role,
        ]);

        return response()->json($personnel->load('direction'));
    }

    public function destroy(Personnel $personnel)
    {
        if ($personnel->photo) {
            Storage::delete('public/' . $personnel->photo);
        }

        $personnel->delete();

        return response()->json(['message' => 'Personnel supprimé avec succès']);
    }

    public function directions()
    {
        $directions = Direction::orderBy('nom', 'ASC')->get();
        return response()->json($directions);
    }
}