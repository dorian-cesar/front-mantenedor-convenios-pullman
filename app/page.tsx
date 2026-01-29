"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { AuthService } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Primero intentar login con el servidor
      const serverResult = await loginAction(email, password);

      if (!serverResult.ok) {
        throw new Error(serverResult.message);
      }

      // 2. También guardar en localStorage para el cliente
      if (typeof window !== "undefined" && serverResult.token) {
        localStorage.setItem("token", serverResult.token);
        
        // Validar token
        const validation = AuthService.validateToken(serverResult.token);
        if (validation.expiresIn) {
          console.log(`Token válido por ${validation.expiresIn} segundos`);
          
          if (validation.expiresIn <= 300) {
            console.warn("Token expira pronto, considere implementar renovación automática");
          }
        }
      }

      // 3. Redirigir al dashboard
      router.push("/dashboard");
      router.refresh();

    } catch (error: any) {
      console.error("Login error:", error);

      // Limpiar tokens en caso de error
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      let errorMessage = "Credenciales inválidas";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Image
              src="/logo-pullman.png"
              alt="Logo Pullman"
              width={300}
              height={100}
              className="object-contain"
            />
            <p className="text-sm text-muted-foreground">
              Convenios Pullman
            </p>
          </div>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información de debug (opcional, solo en desarrollo) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            <p>API URL: {process.env.NEXT_PUBLIC_API_URL || "No configurada"}</p>
            <p>Modo: {process.env.NODE_ENV}</p>
          </div>
        )}
      </div>

      <img
        src="/logo-wit-dark-full.png"
        alt="Logo Wit"
        className="absolute bottom-5 right-5 h-12 w-auto"
      />
    </div>
  );
}