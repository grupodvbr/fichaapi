export default async function handler(req, res) {
  const { produtoId, de, ate } = req.query;

  if (!produtoId || !de || !ate) {
    return res.status(400).json({
      error: "Parâmetros obrigatórios: produtoId, de, ate"
    });
  }

  const TOKEN = process.env.VF_TOKEN;
  const BASE_URL = "https://mercatto.varejofacil.com/api/v1/venda/cupons-fiscais";

  let start = 0;
  const count = 100;
  let total = 1;
  let quantidadeTotal = 0;

  try {
    while (start < total) {
      const url =
        `${BASE_URL}?start=${start}&count=${count}` +
        `&q=dataVenda>=${de} AND dataVenda<=${ate}`;

      const r = await fetch(url, {
        headers: {
          Authorization: `${TOKEN}`
        }
      });

      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt);
      }

      const j = await r.json();
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

    return res.json({
      produtoId,
      periodo: { de, ate },
      quantidadeVendida: quantidadeTotal
    });

  } catch (err) {
    console.error("Erro vendas-produto:", err);
    return res.status(500).json({
      error: "Erro ao consultar vendas no Varejo Fácil"
    });
  }
}
