import { ROLE } from "@/lib/types";
import LoginForm from "../login/login-form";

export default function MiglioLoginPage() {
  return (
    <main className="ds-shell flex items-center justify-center">
      <LoginForm role={ROLE.MIGLIO} title="Accesso Miglio" />
    </main>
  );
}
