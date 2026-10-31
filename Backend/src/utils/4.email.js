/*
🧠 Dependency on which files : config.js
*/

import { Resend } from "resend";
import config from "../config/config.js";

// Create the Resend client only if an API key exists.
// This allows local development without a real Resend API key.
const resend = config.resendApiKey
  ? new Resend(config.resendApiKey)
  : null;

const sendEmail = async ({ to, subject, html }) => {

  // If there is no Resend API key,
  // don't try to send a real email.
  // Just print the email in the terminal.
  if (!resend) {

    console.log(`
[DEV EMAIL]

To: ${to}
Subject: ${subject}

${html}
`);

    return;
  }


  // Send the email through Resend
  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to,
    subject,
    html
  });


  // Resend returned an error
  if (error) {
    console.error("Resend send failed:", error);
  }
};

const sendVerificationEmail = async (to, token) => {
  // Create the verification URL
  const link =
    `${config.clientUrl}/verify-email?token=${token}`;
  // Use the common sendEmail() function
  await sendEmail({
    to,
    subject: "Verify your email",
    html: `
      <p>Welcome!</p>

      <p>
        Please verify your email to activate your account.
      </p>

      <p>
        <a href="${link}">
          Verify your email
        </a>
      </p>

      <p>
        This link expires in 24 hours.
      </p>

      <p>
        If you didn't create this account, you can ignore this email.
      </p>
    `
  });
};

const sendPasswordResetEmail = async (to, token) => {

  const link =
    `${config.clientUrl}/reset-password?token=${token}`;


  await sendEmail({
    to,

    subject: "Reset your password",

    html: `
      <p>
        We received a request to reset your password.
      </p>

      <p>
        <a href="${link}">
          Reset your password
        </a>
      </p>

      <p>
        This link expires in 1 hour.
      </p>

      <p>
        If you didn't request this, you can safely ignore this email.
      </p>
    `
  });
};


export {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
