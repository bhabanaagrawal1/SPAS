import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

import loginImage from "@/assets/login.png";
import { config } from "@/config";
import { apiRequest, setAccessToken } from "@/lib/api";

// Validate login form input.
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginResponse = {
  accessToken: string;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
  message?: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginFormValues) {
    clearErrors("root.server");

    try {
      const result = await apiRequest<LoginResponse>(
        `${config.api.authPrefix}/login`,
        {
          method: "POST",
          body: values,
        },
      );

      // Ensure the backend returned an access token.
      if (!result.accessToken) {
        throw new Error("Login response did not contain an access token.");
      }

      // Save the token so ProtectedRoute and API requests can use it.
      setAccessToken(result.accessToken);

      toast.success(result.message ?? "Login successful!");

      // Return to the requested protected page, or open the student dashboard.
      const destination = location.state?.from?.pathname;
      navigate(
        destination && destination !== "/login"
          ? destination
          : "/overview",
        { replace: true },
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";

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
        <CardContent className="grid min-h-150 p-0 md:grid-cols-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 md:p-8"
            noValidate
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="pt-5 text-5xl font-bold">
                  Welcome back
                </h1>
                <p className="text-balance text-muted-foreground">
                  Enter your email and password to access your account.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="email" className="pt-5 text-xl">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="h-13 w-full border-none bg-[#F4F9FB]"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {errors.email && (
                  <FieldDescription className="text-red-600">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="pt-3 text-xl">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-13 w-full border-none bg-[#F4F9FB]"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                {errors.password && (
                  <FieldDescription className="text-red-600">
                    {errors.password.message}
                  </FieldDescription>
                )}

                <Link
                  to="/"
                  className="ml-auto pt-4 text-right text-sm underline-offset-2 hover:underline"
                >
                  Forgot your password?
                </Link>
              </Field>

              {errors.root?.server && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.root.server.message}
                </p>
              )}

              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-13 bg-black text-lg text-white"
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link to="/signup">Sign up</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src={loginImage}
              alt="Student 360° login illustration"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}