export default async function handler(req, res) {
  const { id } = req.query;

  const token = req.headers.authorization || req.cookies.token;
  if (!token) return res.status(401).json({ error: "Sem token" });

  const r = await fetch(
    `https://mercatto.varejofacil.com/api/v1/produto/produtos/${id}/precos`,
    {
      headers: {
        Authorization: token,
        "Content-Type": "application/json"
      }
    }
  );

  if (!r.ok) {
    return res.status(500).json({ error: "Erro ao buscar preço" });
  }

  const data = await r.json();

  // SEM fallback, SEM invenção
  res.status(200).json(data);
}
