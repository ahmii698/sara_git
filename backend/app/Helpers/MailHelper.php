<?php

namespace App\Helpers;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class MailHelper
{
    public static function sendEmail($to, $subject, $body, $from = null, $fromName = null)
    {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME');
            $mail->Password   = env('MAIL_PASSWORD');
            $mail->SMTPSecure = env('MAIL_ENCRYPTION', PHPMailer::ENCRYPTION_STARTTLS);
            $mail->Port       = env('MAIL_PORT', 587);

            // Recipients
            $mail->setFrom(
                $from ?? env('MAIL_FROM_ADDRESS'),
                $fromName ?? env('MAIL_FROM_NAME', 'SARA Electronics')
            );
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags($body);

            $mail->send();
            return true;
        } catch (Exception $e) {
            \Log::error("Mail Error: {$mail->ErrorInfo}");
            return false;
        }
    }

    public static function sendOtp($email, $otp, $name = '')
    {
        $subject = 'Your OTP for Password Reset - SARA Electronics';
        
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
                
                <p>Dear " . ($name ?: 'User') . ",</p>
                <p>You have requested to reset your password. Please use the following OTP to verify your identity:</p>
                
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

        return self::sendEmail($email, $subject, $body);
    }
}