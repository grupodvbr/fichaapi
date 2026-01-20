export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json([]);
  }

  try {
    const baseUrl = req.headers.host.includes("localhost")
      ? "http://localhost:3000"
      : `https://${req.headers.host}`;

    // 🔐 AUTH EXISTENTE
    const authResp = await fetch(`${baseUrl}/api/auth`);
    const auth = await authResp.json();

    if (!auth.accessToken) {
      return res.status(401).json({ error: "Token VF inválido" });
    }

    const url = `https://mercatto.varejofacil.com/api/v1/produto/produtos/${id}/precos`;

    const resp = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: auth.accessToken
      }
    });

    if (!resp.ok) {
      // ⚠️ PRODUTO SEM PREÇO NÃO QUEBRA O FRONT
      return res.status(200).json([]);
    }

    const data = await resp.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      error: "Erro ao buscar preço do produto",
      message: err.message
    });
  }
}
