async function run() {
  // Apuntamos directamente a la tabla 'lots' (vista en tu captura)
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lots?select=*&limit=1`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Respuesta fallida de Supabase: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Ping exitoso. Consultamos la tabla 'lots'. El proyecto sigue activo.");
    
  } catch (error) {
    console.error("❌ Fallo el ping a Supabase:", error);
    process.exit(1);
  }
}

run();