export default function CuentaVerificadaPage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="inline-block rounded-2xl bg-primary/10 p-6">
          <h1 className="font-[var(--font-display)] text-3xl text-foreground">Cuenta verificada</h1>
        </div>

        <p className="mt-6 text-lg text-muted-foreground">Gracias por confirmar tu correo. Tu cuenta ya está activa y puedes iniciar sesión.</p>

        <div className="mt-6">
          <a href="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    </main>
  );
}
