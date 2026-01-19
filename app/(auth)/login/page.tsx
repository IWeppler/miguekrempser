import { LoginForm } from "@/features/auth/ui/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | AgroGestión",
  description: "Ingreso al sistema",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      {/* Fondo decorativo opcional o simple */}
      <div className="w-full max-w-sm space-y-4">
        <LoginForm />
      </div>
    </div>
  );
}
