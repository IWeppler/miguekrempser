import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 p-3 lg:p-4 overflow-hidden">
      {/* --- COLUMNA IZQUIERDA: IMAGEN FLOTANTE --- */}
      <div className="hidden lg:block relative h-full w-full rounded-[40px] overflow-hidden bg-background">
        <Image
          src="/login-image.jpg"
          alt="Campo inteligente"
          fill
          className="object-cover opacity-90 hover:scale-105 transition-transform duration-[2s] ease-in-out"
          priority
          sizes="50vw"
        />

        {/* Capa oscura base */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Gradiente inferior para el texto */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

        {/* Texto sobre la imagen */}
        <div className="absolute bottom-0 left-0 p-12 z-20 text-white max-w-lg">
          <div className="inline-block px-3 py-1 mb-6 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-xs font-medium tracking-wide">
            🌱 AgroGestión 2.0
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight">
            Transforma tus ideas en cultivos exitosos.
          </h2>
          <p className="text-white text-base leading-relaxed opacity-90">
            La plataforma integral para la gestión eficiente del ciclo
            productivo agropecuario.
          </p>
        </div>
      </div>

      {/* --- COLUMNA DERECHA: FORMULARIO --- */}
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="w-full max-w-[480px] px-6 lg:px-8">{children}</div>

        <div className="absolute bottom-6 text-center text-xs text-foreground/50">
          © 2026 AgroGestión Inc.
        </div>
      </div>
    </div>
  );
}
