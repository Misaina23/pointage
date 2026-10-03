<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permission_requests', function (Blueprint $table): void {
            $table->decimal('requested_days', 5, 2)->default(0)->after('ends_at');
        });

        DB::table('permission_requests')
            ->select(['id', 'permission_date', 'starts_at', 'ends_at'])
            ->orderBy('id')
            ->chunkById(200, function ($requests): void {
                foreach ($requests as $request) {
                    $startsAt = CarbonImmutable::parse($request->permission_date.' '.$request->starts_at);
                    $endsAt = CarbonImmutable::parse($request->permission_date.' '.$request->ends_at);
                    $minutes = max(0, (int) $startsAt->diffInMinutes($endsAt, false));

                    DB::table('permission_requests')
                        ->where('id', $request->id)
                        ->update(['requested_days' => round($minutes / 480, 2)]);
                }
            });

        $annualLeaveTypeId = DB::table('leave_types')
            ->where('code', 'annuel')
            ->value('id');

        if ($annualLeaveTypeId === null) {
            return;
        }

        $year = (int) now()->year;
        $now = now();

        DB::table('employees')
            ->select('id')
            ->orderBy('id')
            ->chunkById(200, function ($employees) use ($annualLeaveTypeId, $year, $now): void {
                foreach ($employees as $employee) {
                    $balance = DB::table('leave_balances')
                        ->where('employee_id', $employee->id)
                        ->where('leave_type_id', $annualLeaveTypeId)
                        ->where('year', $year)
                        ->first();

                    if ($balance) {
                        DB::table('leave_balances')
                            ->where('id', $balance->id)
                            ->update(['allocated_days' => 60, 'updated_at' => $now]);

                        continue;
                    }

                    DB::table('leave_balances')->insert([
                        'employee_id' => $employee->id,
                        'leave_type_id' => $annualLeaveTypeId,
                        'year' => $year,
                        'allocated_days' => 60,
                        'used_days' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('permission_requests', function (Blueprint $table): void {
            $table->dropColumn('requested_days');
        });
    }
};
