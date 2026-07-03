/**
 * Email service to handle sending transactional emails.
 * Uses console logging for development/testing when no API keys are provided.
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    // Local / Dev Mode: Print link to terminal
    console.log("\n========================================================");
    console.log(`[EMAIL MOCK] Password reset request received for: ${email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log("========================================================\n");
    return;
  }

  try {
    // Production Mode: Send real email using Resend (optional implementation)
    // We import dynamically so resend is not a hard requirement in development.
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || "LMS Platform";

    await resend.emails.send({
      from: `${platformName} <noreply@resend.dev>`, // Resend testing domain default, change for custom domain
      to: email,
      subject: `Reset your password for ${platformName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your account on ${platformName}.</p>
          <p>Click the link below to set a new password. This link is valid for 1 hour.</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #555;">${resetLink}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">If you did not request this email, you can safely ignore it.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[EMAIL_SERVICE_ERROR] Failed to send email:", error);
    // Throw error so caller knows sending failed
    throw new Error("Failed to send password reset email");
  }
}
