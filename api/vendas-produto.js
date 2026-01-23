export default async function handler(req, res) {
  const { produtoId, de, ate } = req.query;

  if (!produtoId || !de || !ate) {
    return res.status(400).json({
      error: "Parâmetros obrigatórios: produtoId, de, ate"
    });
  }

  try {
    /* ================= AUTH ================= */
    const authRes = await fetch(
      `${req.headers.origin}/api/auth`
    );

    if (!authRes.ok) {
      const txt = await authRes.text();
      throw new Error("Erro auth: " + txt);
    }

    const authJson = await authRes.json();
    const TOKEN = authJson.accessToken;

    if (!TOKEN) {
      throw new Error("Token não retornado pela API auth");
    }

    /* ================= CUPONS ================= */
    const BASE_URL =
      "https://mercatto.varejofacil.com/api/v1/venda/cupons-fiscais";

    let start = 0;
    const count = 100;
    let total = 1;
    let quantidadeTotal = 0;

    while (start < total) {
      const url =
        `${BASE_URL}?start=${start}&count=${count}` +
        `&dataVendaInicial=${de}&dataVendaFinal=${ate}`;

      const r = await fetch(url, {
        headers: {
          Authorization: TOKEN
        }
      });

      const raw = await r.text();

      if (!r.ok) {
        console.error("VF ERRO:", raw);
        throw new Error(raw);
      }

      const j = JSON.parse(raw);
      total = j.total || 0;

      (j.items || []).forEach(cupom => {
        (cupom.itensVenda || []).forEach(item => {
          if (String(item.produtoId) === String(produtoId)) {
            quantidadeTotal += Number(item.quantidadeVenda || 0);
          }
        });
      });

      start += count;
    }

    return res.status(200).json({
      produtoId,
      periodo: { de, ate },
      quantidadeVendida: quantidadeTotal
    });

  } catch (err) {
    console.error("ERRO vendas-produto:", err);
    return res.status(500).json({
      error: "Erro ao consultar vendas",
      message: err.message
    });
  }
}
