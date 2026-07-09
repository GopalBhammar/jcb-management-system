"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wrench, Loader2, KeyRound, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to log in. Please check your credentials.";
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
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-neutral-400 font-light">
            Sign in to manage JCB rentals and accounting
          </p>
        </div>

        {/* Form Body */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
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
                  placeholder="admin@jcb.com"
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
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-neutral-400 mt-4">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-primary hover:underline font-semibold">
            Sign Up
          </a>
        </div>

        {/* Demo Credentials Alert */}
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center">
          <p className="text-xs text-primary font-medium">
            Demo Credentials
          </p>
          <p className="mt-1 text-xs text-neutral-400 font-light">
            User: <code className="font-semibold text-neutral-200">admin@jcb.com</code> &bull; Password: <code className="font-semibold text-neutral-200">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
