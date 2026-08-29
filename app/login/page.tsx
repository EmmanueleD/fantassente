import { ROLE } from "@/lib/types";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="ds-shell flex items-center justify-center">
      <LoginForm role={ROLE.JABU} />
    </main>
  );
}
