export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "ID do produto não informado" });
    }

    /* ================== 1️⃣ AUTH ================== */
    const authResp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth`);
    const authText = await authResp.text();

    if (!authResp.ok) {
      return res.status(500).json({
        error: "Falha ao autenticar no Varejo Fácil",
        raw: authText
      });
    }

    const auth = JSON.parse(authText);
    const token = auth.accessToken;

    if (!token) {
      return res.status(401).json({ error: "Token não retornado pelo auth" });
    }

    /* ================== 2️⃣ BUSCA PREÇO ================== */
    const precoResp = await fetch(
      `https://villachopp.varejofacil.com/api/v1/produto/produtos/${id}/precos`,
      {
        method: "GET",
        headers: {
          Authorization: token, // 🔥 SEM Bearer
          Accept: "application/json"
        }
      }
    );

    const precoText = await precoResp.text();

    if (!precoResp.ok) {
      return res.status(precoResp.status).json({
        error: "Erro ao buscar preço do produto",
        raw: precoText
      });
    }

    /* ================== 3️⃣ RESPOSTA ================== */
    const precoJson = JSON.parse(precoText);

    // ⚠️ SEM fallback
    // ⚠️ SEM inventar valor
    return res.status(200).json(precoJson);

  } catch (err) {
    console.error("ERRO PRODUTO PREÇO:", err);
    return res.status(500).json({
      error: "Erro interno na API de preço",
      message: err.message
    });
  }
}
