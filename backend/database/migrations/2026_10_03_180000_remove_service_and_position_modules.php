<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table): void {
            $table->dropForeign(['service_id']);
            $table->dropForeign(['position_id']);
            $table->dropIndex('employees_direction_id_department_id_service_id_index');
            $table->dropColumn(['service_id', 'position_id']);
        });

        Schema::dropIfExists('services');
        Schema::dropIfExists('positions');
    }

    public function down(): void
    {
        Schema::create('services', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('department_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['department_id', 'name']);
        });

        Schema::create('positions', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->foreignId('service_id')->nullable()->after('department_id')->constrained()->nullOnDelete();
            $table->foreignId('position_id')->nullable()->after('service_id')->constrained()->nullOnDelete();
            $table->index(['direction_id', 'department_id', 'service_id']);
        });
    }
};
