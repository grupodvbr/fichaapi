async function autenticarVF() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Usuario>
  <username>NALBERT SOUZA</username>
  <password>99861</password>
</Usuario>`;

  const response = await fetch(
    "https://mercatto.varejofacil.com/api/auth",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "Accept": "application/json"
      },
      body: xml
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    console.error("AUTH ERRO:", raw);
    throw new Error("Erro ao autenticar no Varejo Fácil");
  }

  const json = JSON.parse(raw);
  return json.accessToken;
}

export default async function handler(req, res) {
  const { produtoId, de, ate } = req.query;

  if (!produtoId || !de || !ate) {
    return res.status(400).json({
      error: "Parâmetros obrigatórios: produtoId, de, ate"
    });
  }

  try {
    /* ================= AUTH ================= */
    const TOKEN = await autenticarVF();

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
        throw new Error("Erro ao buscar cupons fiscais");
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
