"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginSchema } from "../schemas/login-schema";
import { login } from "../actions/login";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Loader2, AlertCircle, Sprout, ArrowRight } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER LIMPIO (Sin CardHeader) */}
      <div className="space-y-2">
        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
          <Sprout className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tus credenciales para acceder al panel.
        </p>
      </div>

      {/* FORMULARIO */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="nombre@campo.com"
                      {...field}
                      className="h-11 bg-muted/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Contraseña</FormLabel>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="h-11 bg-muted/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="
    group
    w-full h-11
    bg-primary hover:bg-primary/90
    text-primary-foreground
    font-medium text-base
    shadow-lg shadow-primary/20
    mt-2

    transition-colors duration-200 ease-out
  "
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                Ingresar al Sistema
                <ArrowRight
                  className="
          h-4 w-4
          transition-all duration-300 ease-out
          group-hover:translate-x-1
          group-hover:opacity-100
          opacity-80
        "
                />
              </div>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
