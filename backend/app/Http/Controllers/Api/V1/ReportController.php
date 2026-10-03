<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    /**
     * Rapport quotidien.
     */
    public function daily(Request $request): JsonResponse
    {
        $this->authorizeReport($request);

        $date = CarbonImmutable::parse($request->input('date', CarbonImmutable::now()->toDateString()));

        return response()->json(
            $this->reports->dailySummary($date, $this->departmentId($request))
        );
    }

    /**
     * Rapport mensuel.
     */
    public function monthly(Request $request): JsonResponse
    {
        $this->authorizeReport($request);

        $month = CarbonImmutable::parse($request->input('month', CarbonImmutable::now()->format('Y-m')));

        return response()->json(
            $this->reports->monthlySummary($month, $this->departmentId($request))
        );
    }

    /**
     * Indicateurs agrégés par département.
     */
    public function byDepartment(Request $request): JsonResponse
    {
        $this->authorizeReport($request);

        $from = CarbonImmutable::parse($request->input('from', CarbonImmutable::now()->startOfMonth()));
        $to = CarbonImmutable::parse($request->input('to', CarbonImmutable::now()->endOfMonth()));

        return response()->json([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'late' => $this->reports->lateByDepartment($from, $to),
            'absences' => $this->reports->absencesByDepartment($from, $to),
        ]);
    }

    private function authorizeReport(Request $request): void
    {
        abort_unless($request->user()->hasPermission('reports.view'), 403);
    }

    private function departmentId(Request $request): ?int
    {
        return $request->filled('department_id') ? $request->integer('department_id') : null;
    }
}
