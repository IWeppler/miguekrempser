async function pingSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "❌ Faltan las credenciales de Supabase en las variables de entorno.",
    );
    process.exit(1);
  }

  const url = `${supabaseUrl}/rest/v1/`;

  try {
    console.log("⏳ Haciendo ping a Supabase para evitar inactividad...");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log(
        "✅ ¡Ping exitoso! La base de datos de Supabase se mantiene despierta.",
      );
    } else {
      console.error(
        `⚠️ El servidor respondió con estado: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("❌ Error de red al intentar conectar con Supabase:", error);
    process.exit(1);
  }
}

pingSupabase();
