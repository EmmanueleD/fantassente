import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="sb-stage flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-chalk-200">
      <div className="animate-sb-settle flex flex-col items-center gap-2 text-center">
        <h1 className="sb-jumbo text-faro-500 drop-shadow-flood text-5xl md:text-6xl">
          FANTASSENTE
        </h1>
        <div className="h-px w-24 bg-chalk-200/40" aria-hidden="true" />
        <p className="font-display text-xs uppercase tracking-board text-night-500">
          Asta &middot; Proxy Bidder
        </p>
      </div>
      <div className="animate-sb-settle [animation-delay:60ms]">
        <LoginForm />
      </div>
    </main>
  );
}
