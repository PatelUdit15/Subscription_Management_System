import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

def build_otp_html_email(otp: str, user_name: Optional[str] = None) -> str:
    """Generate modern, responsive HTML email template for OTP password reset."""
    display_name = user_name or "Valued User"
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          <!-- Header banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A4174 0%, #875A7B 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🔐</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
                SubscriptionFlow
              </h1>
              <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">
                Password Reset Verification
              </p>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                Hello {display_name},
              </p>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                We received a request to reset the password for your SubscriptionFlow account. Use the verification code (OTP) below to complete your reset.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: #f8fafc; border: 2px dashed #875A7B; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #875A7B; margin-bottom: 8px;">
                  Your One-Time Password
                </div>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0A4174; font-family: 'Courier New', Courier, monospace;">
                  {otp}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                  ⏱️ Valid for <strong>10 minutes</strong> only
                </div>
              </div>

              <!-- Security notice -->
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 12.5px; line-height: 1.5;">
                  <strong>Security Note:</strong> Never share this code with anyone. SubscriptionFlow representatives will never ask for your verification code.
                </p>
              </div>

              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you did not make this request, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                &copy; 2026 SubscriptionFlow &bull; Brightloop Software Inc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def send_password_reset_otp_email(to_email: str, otp: str, user_name: Optional[str] = None) -> Tuple[bool, str]:
    """
    Send OTP verification email via Google Mail (Gmail SMTP).
    Returns (success: bool, message: str).
    """
    smtp_host = settings.SMTP_HOST or "smtp.gmail.com"
    smtp_port = settings.SMTP_PORT or 587
    smtp_user = (settings.SMTP_USER or "").strip()
    smtp_password = (settings.SMTP_PASSWORD or "").strip()
    from_name = settings.EMAILS_FROM_NAME or "SubscriptionFlow Support"
    from_email = (settings.EMAILS_FROM_EMAIL or smtp_user or "no-reply@subscriptionflow.com").strip()

    subject = f"{otp} is your SubscriptionFlow verification code"

    # Fallback to simulated delivery if Gmail credentials are not yet configured in .env
    if not smtp_user or not smtp_password:
        sim_msg = (
            f"[GMAIL SIMULATION] To: {to_email} | OTP: {otp} | "
            f"Gmail SMTP credentials not set in backend/.env. OTP displayed for testing."
        )
        print(sim_msg)
        logger.info(sim_msg)
        return True, "Gmail SMTP not configured. OTP generated and logged to console."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email

        plain_text = (
            f"Hello {user_name or 'there'},\n\n"
            f"Your SubscriptionFlow password reset OTP code is: {otp}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"SubscriptionFlow Support"
        )
        html_text = build_otp_html_email(otp=otp, user_name=user_name)

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_text, "html", "utf-8"))

        print(f"[INFO] Connecting to Gmail SMTP ({smtp_host}:{smtp_port}) to send OTP to {to_email}...")
        with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            print(f"[SUCCESS] OTP email successfully sent via Gmail SMTP to {to_email}")

        return True, "OTP email sent successfully via Google Mail."

    except Exception as e:
        error_msg = f"Failed to send email via Google Mail SMTP: {str(e)}"
        print(f"[ERROR] {error_msg}")
        logger.error(error_msg)
        return False, error_msg
