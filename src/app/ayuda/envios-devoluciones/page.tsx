export default function EnviosDevolucionesPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/45 p-6 shadow-[0_24px_80px_rgba(117,82,63,0.12)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(166,118,92,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.72),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.35))]" />
        <div className="relative space-y-8">
          <header className="space-y-2">
            <h1 className="font-[var(--font-display)] text-3xl">Envíos y devoluciones</h1>
            <p className="text-sm text-muted-foreground">Información clara sobre tiempos de entrega, cambios y devoluciones.</p>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur-md">
              <h2 className="text-lg font-semibold">Envíos</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Procesamos los pedidos en un plazo de 24 a 48 horas hábiles una vez confirmada la compra. El tiempo total de entrega depende de la ciudad o localidad de destino y del operador logístico.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                En zonas urbanas, la entrega suele tomar entre 2 y 5 días hábiles. En zonas de cobertura extendida puede tomar un poco más. Cuando tu pedido sea despachado, compartiremos el número de seguimiento si aplica.
              </p>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur-md">
              <h2 className="text-lg font-semibold">Cobertura y costos</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                El costo de envío se calcula según el destino, el tamaño del paquete y el método de entrega seleccionado. En campañas especiales podemos ofrecer envío gratis o tarifas promocionales.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Si tu pedido requiere una confirmación adicional, te escribiremos por WhatsApp o correo antes de despachar.
              </p>
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur-md">
              <h2 className="text-lg font-semibold">Cambios</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Aceptamos cambios por error en el pedido, producto defectuoso o si recibiste un artículo distinto al solicitado. Debes comunicarte con nosotros dentro de los 7 días posteriores a la recepción.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                El producto debe estar sin uso, en su empaque original y con sus accesorios completos para poder procesar el cambio.
              </p>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur-md">
              <h2 className="text-lg font-semibold">Devoluciones</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Las devoluciones se evalúan caso por caso. Si corresponde, te indicaremos el procedimiento para coordinar la recogida o el envío de retorno.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Una vez recibido el producto y verificado su estado, gestionaremos el reembolso o la nota de crédito según la forma de pago y la política vigente.
              </p>
            </article>
          </section>

          <section className="rounded-2xl border border-primary/15 bg-primary/5 p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold">¿Necesitas ayuda?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Escríbenos con tu número de pedido, nombre completo y una breve descripción del caso. Así podremos darte una respuesta más rápida y precisa.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
