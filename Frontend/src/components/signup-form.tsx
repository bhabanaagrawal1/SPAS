import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import LoginImage from "@/assets/login.png";

import { config } from "@/config";
import { apiRequest } from "@/lib/api";
import {
  signupSchema,
  type SignupFormValues,
} from "@/schemas/auth.schema";

type SignupResponse = {
  message?: string;
};

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      registrationId: "",
    },
    mode: "onBlur",
  });

  const navigate = useNavigate();

  async function onSubmit(values: SignupFormValues) {
    clearErrors("root.server");

    try {
      const result = await apiRequest<SignupResponse>(
        `${config.api.authPrefix}/register`,
        {
          method: "POST",
          body: values,
        },
      );

      toast.success(
        result.message ??
          "Registration successful. Please check your email for verification.",
      );

      reset();
      // Navigate only after successful registration
      navigate("/overview", { replace: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      setError("root.server", {
        type: "server",
        message,
      });

      toast.error(message);
    }
  }

  return (
    <div
      className={cn("flex w-full flex-col gap-6", className)}
      {...props}
    >
      <Card className="w-full overflow-hidden bg-white p-0">
        <CardContent className="grid min-h-160 p-0 md:grid-cols-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 md:p-8"
            noValidate
          >
            <FieldGroup>
              {/* Heading */}
              <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="pt-5 text-5xl font-bold">
                  Get Started
                </h1>

                <p className="text-balance text-muted-foreground">
                  Enter your credentials to create your account.
                </p>
              </div>

              {/* Email */}
              <Field>
                <FieldLabel htmlFor="email" className="pt-2 text-xl">
                  Email
                </FieldLabel>

                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="h-13 w-full border-none bg-[#F4F9FB]"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "email-error" : undefined
                  }
                  {...register("email")}
                />

                {errors.email && (
                  <FieldDescription
                    id="email-error"
                    className="text-red-600"
                  >
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Password */}
              <Field>
                <FieldLabel
                  htmlFor="password"
                  className="pt-1 text-xl"
                >
                  Password
                </FieldLabel>

                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  className="h-13 w-full border-none bg-[#F4F9FB]"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : "password-help"
                  }
                  {...register("password")}
                />

                <FieldDescription id="password-help">
                  At least 8 characters, including uppercase,
                  lowercase, a number, and a special character.
                </FieldDescription>

                {errors.password && (
                  <FieldDescription
                    id="password-error"
                    className="text-red-600"
                  >
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Registration number */}
              <Field>
                <FieldLabel
                  htmlFor="registrationId"
                  className="pt-1 text-xl"
                >
                  Regd No
                </FieldLabel>

                <Input
                  id="registrationId"
                  type="text"
                  autoComplete="off"
                  placeholder="Enter your registration number"
                  className="h-13 w-full border-none bg-[#F4F9FB]"
                  aria-invalid={Boolean(errors.registrationId)}
                  aria-describedby={
                    errors.registrationId
                      ? "registrationId-error"
                      : undefined
                  }
                  {...register("registrationId")}
                />

                {errors.registrationId && (
                  <FieldDescription
                    id="registrationId-error"
                    className="text-red-600"
                  >
                    {errors.registrationId.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Backend error */}
              {errors.root?.server && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.root.server.message}
                </p>
              )}

              {/* Submit button */}
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-13 w-full bg-black text-lg text-white"
                >
                  {isSubmitting
                    ? "Creating account..."
                    : "Create Account"}
                </Button>
              </Field>

              {/* Login link */}
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Signup illustration */}
          <div className="relative hidden bg-muted md:block">
            <img
              src={LoginImage}
              alt="Student 360° signup illustration"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal links */}
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link to="/terms" className="underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}