<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkScheduleResource;
use App\Models\EmployeeWorkSchedule;
use App\Models\Holiday;
use App\Models\WorkSchedule;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeSchedule($request);

        return response()->json([
            'data' => WorkScheduleResource::collection(
                WorkSchedule::query()
                    ->with('days')
                    ->orderBy('name')
                    ->get()
            )->resolve($request),
            'holidays' => Holiday::query()
                ->whereBetween('date', [now()->startOfYear(), now()->endOfYear()])
                ->orderBy('date')
                ->get()
                ->map(fn (Holiday $holiday): array => [
                    'id' => $holiday->id,
                    'name' => $holiday->name,
                    'date' => $holiday->date?->toDateString(),
                    'is_paid' => $holiday->is_paid,
                ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeSchedule($request, true);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'schedule_type' => ['required', 'string', 'max:50'],
            'late_tolerance_minutes' => ['required', 'integer', 'between:0,120'],
            'is_active' => ['sometimes', 'boolean'],
            'days' => ['required', 'array', 'min:1'],
            'days.*.day_of_week' => ['required', 'integer', 'between:1,7'],
            'days.*.starts_at' => ['nullable', 'date_format:H:i'],
            'days.*.ends_at' => ['nullable', 'date_format:H:i'],
            'days.*.break_starts_at' => ['nullable', 'date_format:H:i'],
            'days.*.break_ends_at' => ['nullable', 'date_format:H:i'],
        ]);

        $schedule = WorkSchedule::query()->create([
            'name' => $validated['name'],
            'schedule_type' => $validated['schedule_type'],
            'late_tolerance_minutes' => $validated['late_tolerance_minutes'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $schedule->days()->createMany($this->normalizeDays($validated['days']));

        $this->audit->record('CREATE_WORK_SCHEDULE', $schedule, null, ['name' => $schedule->name], $request);

        return (new WorkScheduleResource($schedule->load('days')))->response()->setStatusCode(201);
    }

    public function update(Request $request, WorkSchedule $workSchedule): WorkScheduleResource
    {
        $this->authorizeSchedule($request, true);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'schedule_type' => ['sometimes', 'string', 'max:50'],
            'late_tolerance_minutes' => ['sometimes', 'integer', 'between:0,120'],
            'is_active' => ['sometimes', 'boolean'],
            'days' => ['sometimes', 'array'],
            'days.*.day_of_week' => ['required', 'integer', 'between:1,7'],
            'days.*.starts_at' => ['nullable', 'date_format:H:i'],
            'days.*.ends_at' => ['nullable', 'date_format:H:i'],
            'days.*.break_starts_at' => ['nullable', 'date_format:H:i'],
            'days.*.break_ends_at' => ['nullable', 'date_format:H:i'],
        ]);

        $scheduleData = collect($validated)->except('days')->all();
        $workSchedule->fill($scheduleData)->save();

        if (isset($validated['days'])) {
            $workSchedule->days()->delete();
            $workSchedule->days()->createMany($this->normalizeDays($validated['days']));
        }

        return new WorkScheduleResource($workSchedule->load('days'));
    }

    /**
     * Affecte un horaire à un employé sur une période.
     */
    public function assign(Request $request): JsonResponse
    {
        $this->authorizeSchedule($request, true);

        $validated = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'work_schedule_id' => ['required', 'integer', 'exists:work_schedules,id'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ]);

        $assignment = EmployeeWorkSchedule::query()->create($validated);

        $this->audit->record('ASSIGN_WORK_SCHEDULE', $assignment, null, $validated, $request);

        return response()->json(['data' => $assignment], 201);
    }

    /**
     * Jours fériés.
     */
    public function holidays(Request $request): JsonResponse
    {
        $this->authorizeSchedule($request);

        $year = (int) $request->input('year', now()->year);

        return response()->json([
            'data' => Holiday::query()
                ->whereBetween('date', ["{$year}-01-01", "{$year}-12-31"])
                ->orderBy('date')
                ->get()
                ->map(fn (Holiday $holiday): array => [
                    'id' => $holiday->id,
                    'name' => $holiday->name,
                    'date' => $holiday->date?->toDateString(),
                    'is_paid' => $holiday->is_paid,
                    'description' => $holiday->description,
                ]),
        ]);
    }

    public function storeHoliday(Request $request): JsonResponse
    {
        $this->authorizeSchedule($request, true);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'date' => ['required', 'date'],
            'is_paid' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $holiday = Holiday::query()->create($validated);

        $this->audit->record('CREATE_HOLIDAY', $holiday, null, $validated, $request);

        return response()->json(['data' => $holiday], 201);
    }

    /**
     * @param  array<int, array<string, string|null>>  $days
     * @return array<int, array<string, string|null>>
     */
    private function normalizeDays(array $days): array
    {
        return array_map(fn (array $day): array => [
            'day_of_week' => (string) $day['day_of_week'],
            'starts_at' => $this->timeOrNull($day['starts_at'] ?? null),
            'ends_at' => $this->timeOrNull($day['ends_at'] ?? null),
            'break_starts_at' => $this->timeOrNull($day['break_starts_at'] ?? null),
            'break_ends_at' => $this->timeOrNull($day['break_ends_at'] ?? null),
        ], $days);
    }

    private function timeOrNull(?string $time): ?string
    {
        return $time === null ? null : substr($time, 0, 5).':00';
    }

    private function authorizeSchedule(Request $request, bool $write = false): void
    {
        abort_unless(
            $request->user()->hasPermission($write ? 'schedules.manage' : 'planning.view'),
            403,
        );
    }
}
