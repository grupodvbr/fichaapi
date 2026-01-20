export default async function handler(req, res) {
  try {
    const { id } = req.query;

    /* ================= VALIDAÇÕES ================= */
    if (!id) {
      return res.status(400).json({ error: "ID do produto não informado" });
    }

    // token vem cru (sem Bearer)
    const token = req.headers.authorization || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Token não encontrado" });
    }

    /* ================= REQUEST VAREJO FÁCIL ================= */
    const response = await fetch(
      `https://mercatto.varejofacil.com/api/v1/produto/produtos/${id}/precos`,
      {
        method: "GET",
        headers: {
          Authorization: token, // 🔥 SEM Bearer
          Accept: "application/json"
        }
      }
    );

    /* ================= TRATAMENTO DE ERROS ================= */
    if (response.status === 401) {
      return res.status(401).json({ error: "Token inválido no Varejo Fácil" });
    }

    if (response.status === 404) {
      return res.status(404).json({ error: "Preço não encontrado no Varejo Fácil" });
    }

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({
        error: "Erro ao consultar preços no Varejo Fácil",
        detalhe: text
      });
    }

    /* ================= RESPOSTA FINAL ================= */
    const data = await response.json();

    // ⚠️ SEM fallback
    // ⚠️ SEM valor padrão
    // ⚠️ SEM inventar preço
    return res.status(200).json(data);

  } catch (err) {
    console.error("ERRO API PRODUTO PREÇO:", err);
    return res.status(500).json({
      error: "Erro inesperado na API de preço",
      message: err.message
    });
  }
}
