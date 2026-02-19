export async function runMigration(sql: string) {
  const neonHost = process.env.MYSHOP_NEON_HOST;
  if (!neonHost) {
    throw new Error("MYSHOP_NEON_HOST environment variable not set");
  }

  const response = await fetch(`https://${neonHost}/sql`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MYSHOP_DATABASE_URL}`,
      "Content-Type": "application/sql",
    },
    body: sql,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Migration failed: ${error}`);
  }

  return await response.json();
}