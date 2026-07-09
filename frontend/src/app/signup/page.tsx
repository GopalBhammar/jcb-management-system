"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wrench, Loader2, KeyRound, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api";

const signupSchema = z.object({
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirm_password: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type SignupSchemaType = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: SignupSchemaType) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        json: {
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          role: "operator",
        },
      });
      setSuccess(true);
      // Auto-login after successful signup
      setTimeout(async () => {
        try {
          await login(data.email, data.password);
        } catch {
          // If auto-login fails, user can manually login
          window.location.href = "/login";
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-neutral-800 bg-neutral-950/50 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-neutral-900 font-bold shadow-lg shadow-primary/20">
            <Wrench className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-neutral-400 font-light">
            Sign up to manage JCB rentals and accounting
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Account created successfully! Logging you in...</span>
          </div>
        )}

        {/* Form Body */}
        {!success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label htmlFor="full_name" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    {...register("full_name")}
                    className={`block w-full rounded-xl border ${
                      errors.full_name ? "border-red-500/50 focus:ring-red-500/25" : "border-neutral-800 focus:ring-primary/25"
                    } bg-neutral-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={`block w-full rounded-xl border ${
                      errors.email ? "border-red-500/50 focus:ring-red-500/25" : "border-neutral-800 focus:ring-primary/25"
                    } bg-neutral-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={`block w-full rounded-xl border ${
                      errors.password ? "border-red-500/50 focus:ring-red-500/25" : "border-neutral-800 focus:ring-primary/25"
                    } bg-neutral-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirm_password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirm_password")}
                    className={`block w-full rounded-xl border ${
                      errors.confirm_password ? "border-red-500/50 focus:ring-red-500/25" : "border-neutral-800 focus:ring-primary/25"
                    } bg-neutral-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm text-neutral-400 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-semibold">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
