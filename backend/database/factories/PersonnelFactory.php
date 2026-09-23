<?php

namespace Database\Factories;

use App\Models\Personnel;
use App\Models\Direction;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PersonnelFactory extends Factory
{
    protected $model = Personnel::class;

    public function definition()
    {
        $directionId = Direction::inRandomOrder()->first()?->id ?? 1;
        $qrCode = 'PERS-' . strtoupper(Str::random(10));

        return [
            'nom' => $this->faker->lastName(),
            'prenom' => $this->faker->firstName(),
            'direction_id' => $directionId,
            'service' => $this->faker->word(),
            'grade' => $this->faker->word(),
            'corp' => $this->faker->word(),
            'fonction' => $this->faker->jobTitle(),
            'IM' => strtoupper(Str::random(6)),
            'email' => $this->faker->unique()->safeEmail(),
            'photo' => $this->faker->imageUrl(),
            'password' => bcrypt('password'),
            'qr_code' => $qrCode,
            'role' => $this->faker->randomElement(['employee', 'security']),
        ];
    }
}