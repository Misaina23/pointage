<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeDevice($request);

        return response()->json([
            'data' => Device::query()
                ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
                ->orderBy('name')
                ->get()
                ->map(fn (Device $device): array => $this->transformer($device)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeDevice($request, true);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'device_code' => ['required', 'string', 'max:100', 'unique:devices,device_code'],
            'location' => ['nullable', 'string', 'max:200'],
        ]);

        $device = Device::query()->create($validated);

        $this->audit->record('CREATE_DEVICE', $device, null, $validated, $request);

        return response()->json(['data' => $this->transformer($device)], 201);
    }

    public function destroy(Device $device): JsonResponse
    {
        $this->authorizeDevice(request(), true);

        $device->forceFill(['status' => 'inactive'])->save();

        $this->audit->record('DEACTIVATE_DEVICE', $device, ['status' => 'active'], ['status' => 'inactive'], request());

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformer(Device $device): array
    {
        return [
            'id' => $device->id,
            'name' => $device->name,
            'device_code' => $device->device_code,
            'location' => $device->location,
            'status' => $device->status,
            'last_seen_at' => $device->last_seen_at?->toIso8601String(),
        ];
    }

    private function authorizeDevice(Request $request, bool $write = false): void
    {
        abort_unless($request->user()->hasPermission($write ? 'employees.manage' : 'attendance.view'), 403);
    }
}
