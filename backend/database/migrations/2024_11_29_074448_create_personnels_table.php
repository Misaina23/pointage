<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('personnels', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->foreignId('direction_id')->constrained('directions')->onDelete('cascade');
            $table->string('service');
            $table->string('grade');
            $table->string('corp');
            $table->string('fonction');
            $table->string('IM');
            $table->string('email');
            $table->string('photo')->nullable();
            $table->string('password')->nullable();
            $table->string('qr_code')->unique()->nullable();
            $table->enum('role', ['employee', 'security'])->default('employee');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('personnels');
    }
};