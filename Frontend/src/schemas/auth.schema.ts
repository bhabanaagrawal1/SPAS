
import { z } from "zod";

// Rules for the Student 360° signup form.
export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "College email is required.")
    .email("Enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .regex(/\d/, "Password must contain at least one number.")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character.",
    ),

  registrationId: z
    .string()
    .trim()
    .min(1, "Registration number is required."),
});

// Automatically derive the TypeScript type from the schema.
export type SignupFormValues = z.infer<typeof signupSchema>;