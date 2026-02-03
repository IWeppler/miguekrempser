import { LoginForm } from "@/features/auth/ui/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | El Tolar SA",
  description: "Ingreso al sistema",
};

export default function LoginPage() {
  return <LoginForm />;
}
