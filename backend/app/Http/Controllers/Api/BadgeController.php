<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personnel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class BadgeController extends Controller
{
    public function show(Personnel $personnel)
    {
        // Generate QR code as SVG
        $qrCode = QrCode::format('svg')
            ->size(300)
            ->margin(10)
            ->color(0, 0, 0)
            ->backgroundColor(255, 255, 255)
            ->generate($personnel->qr_code);

        return response($qrCode, 200, [
            'Content-Type' => 'image/svg+xml',
            'Content-Disposition' => 'inline; filename="badge-' . $personnel->qr_code . '.svg"'
        ]);
    }

    public function download(Personnel $personnel)
    {
        // Generate QR code as PNG for download
        $qrCode = QrCode::format('png')
            ->size(500)
            ->margin(10)
            ->color(0, 0, 0)
            ->backgroundColor(255, 255, 255)
            ->generate($personnel->qr_code);

        return response($qrCode, 200, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'attachment; filename="badge-' . $personnel->qr_code . '.png"'
        ]);
    }

    public function myBadge(Request $request)
    {
        $personnel = $request->user();

        // Generate QR code as SVG
        $qrCode = QrCode::format('svg')
            ->size(300)
            ->margin(10)
            ->color(0, 0, 0)
            ->backgroundColor(255, 255, 255)
            ->generate($personnel->qr_code);

        return response()->json([
            'personnel' => $personnel->load('direction'),
            'qr_code' => $personnel->qr_code,
            'qr_code_svg' => $qrCode,
        ]);
    }
}