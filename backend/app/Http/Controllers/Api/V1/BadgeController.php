<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BadgeStatus;
use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BadgeController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeBadgeManagement($request);

        return response()->json([
            'data' => Badge::query()
                ->with(['employee'])
                ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
                ->when($request->filled('employee_id'), fn ($query) => $query->where('employee_id', $request->integer('employee_id')))
                ->orderBy('badge_number')
                ->get()
                ->map(fn (Badge $badge): array => $this->transformer($badge)),
            'meta' => ['total' => Badge::query()->count()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeBadgeManagement($request);

        $validated = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'badge_number' => ['required', 'string', 'max:50', 'unique:badges,badge_number'],
        ]);

        $badge = Badge::query()->create([
            'employee_id' => $validated['employee_id'],
            'public_id' => (string) Str::uuid(),
            'badge_number' => $validated['badge_number'],
            'status' => BadgeStatus::Active->value,
            'issued_at' => now(),
        ]);

        $this->audit->record('ISSUE_BADGE', $badge, null, ['badge_number' => $badge->badge_number], $request);

        return response()->json(['data' => $this->transformer($badge->load('employee'))], 201);
    }

    public function revoke(Request $request, Badge $badge): JsonResponse
    {
        $this->authorizeBadgeManagement($request);

        if ($badge->status === BadgeStatus::Revoked) {
            return response()->json(['message' => 'Ce badge est déjà révoqué.'], 422);
        }

        $badge->forceFill([
            'status' => BadgeStatus::Revoked->value,
            'revoked_at' => now(),
        ])->save();

        $this->audit->record('REVOKE_BADGE', $badge, ['status' => 'active'], ['status' => 'revoked'], $request);

        return response()->json(['data' => $this->transformer($badge->load('employee'))]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformer(Badge $badge): array
    {
        return [
            'id' => $badge->id,
            'public_id' => $badge->public_id,
            'badge_number' => $badge->badge_number,
            'status' => $badge->status->value,
            'status_label' => $badge->status->label(),
            'issued_at' => $badge->issued_at?->toIso8601String(),
            'revoked_at' => $badge->revoked_at?->toIso8601String(),
            'employee' => $badge->employee === null ? null : [
                'id' => $badge->employee->id,
                'employee_number' => $badge->employee->employee_number,
                'full_name' => $badge->employee->fullName(),
                'department' => $badge->employee->department?->name,
                'photo_url' => $badge->employee->photo_path === null
                    ? null
                    : Storage::disk('public')->url($badge->employee->photo_path),
            ],
        ];
    }

    private function authorizeBadgeManagement(Request $request): void
    {
        abort_unless($request->user()->hasPermission('employees.manage'), 403);
    }
}
