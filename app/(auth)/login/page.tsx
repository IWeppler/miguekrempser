import { LoginForm } from "@/features/auth/ui/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | AgroGestión",
  description: "Ingreso al sistema",
};

export default function LoginPage() {
  return <LoginForm />;
}
