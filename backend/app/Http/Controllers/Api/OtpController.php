<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class OtpController extends Controller
{
    // ============================================
    // ✅ SEND OTP - USE CACHE INSTEAD OF SESSION
    // ============================================
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'role' => 'required|string'
        ]);

        $user = User::where('email', $request->email)
                    ->where('role', $request->role)
                    ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found with this email and role'
            ], 404);
        }

        // Generate OTP
        $otp = rand(100000, 999999);
        
        // ✅ Store OTP in Cache with 10 minutes expiry
        Cache::put('otp_' . $request->email, (string)$otp, 600); // 10 minutes

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME');
            $mail->Password   = env('MAIL_PASSWORD');
            $mail->SMTPSecure = env('MAIL_ENCRYPTION', PHPMailer::ENCRYPTION_STARTTLS);
            $mail->Port       = env('MAIL_PORT', 587);

            $mail->setFrom(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME', 'SARA Electronics'));
            $mail->addAddress($request->email, $user->name);

            $mail->isHTML(true);
            $mail->Subject = 'Your OTP for Password Reset - SARA Electronics';

            $body = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 2px solid #1E1B4B; padding-bottom: 15px; }
                    .header h1 { color: #1E1B4B; margin: 0; }
                    .otp-code { font-size: 36px; font-weight: bold; color: #1E1B4B; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>SARA Electronics</h1>
                        <p>Password Reset Request</p>
                    </div>
                    
                    <p>Dear " . $user->name . ",</p>
                    <p>You have requested to reset your password. Please use the following OTP:</p>
                    
                    <div class='otp-code'>" . $otp . "</div>
                    
                    <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    
                    <div class='footer'>
                        <p>&copy; " . date('Y') . " SARA Electronics. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            ";

            $mail->Body = $body;
            $mail->AltBody = strip_tags($body);

            $mail->send();

            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully',
                'otp' => (string)$otp
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP: ' . $mail->ErrorInfo
            ], 500);
        }
    }

    // ============================================
    // ✅ VERIFY OTP - USE CACHE
    // ============================================
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6'
        ]);

        // ✅ Get OTP from Cache
        $storedOtp = Cache::get('otp_' . $request->email);

        if (!$storedOtp) {
            return response()->json([
                'success' => false,
                'message' => 'OTP expired. Please request a new OTP.'
            ], 400);
        }

        // ✅ Compare OTP
        if ((string)$storedOtp !== (string)$request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP'
            ], 400);
        }

        // ✅ Clear OTP after verification
        Cache::forget('otp_' . $request->email);

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully'
        ]);
    }
}