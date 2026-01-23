async function autenticarVF() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Usuario>
  <username>NALBERT SOUZA</username>
  <password>99861</password>
</Usuario>`;

  const r = await fetch(
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

  const raw = await r.text();
  if (!r.ok) throw new Error(raw);

  return JSON.parse(raw).accessToken;
}

export default async function handler(req, res) {
  const { produtoId, de, ate, start = 0 } = req.query;

  if (!produtoId || !de || !ate) {
    return res.status(400).json({ error: "Parâmetros obrigatórios" });
  }

  try {
    const TOKEN = await autenticarVF();

    const COUNT = 50;
    const url =
      `https://mercatto.varejofacil.com/api/v1/venda/cupons-fiscais` +
      `?start=${start}&count=${COUNT}` +
      `&dataVendaInicial=${de}&dataVendaFinal=${ate}`;

    const r = await fetch(url, {
      headers: { Authorization: TOKEN }
    });

    const j = await r.json();

    let somaPagina = 0;

    (j.items || []).forEach(cupom => {
      (cupom.itensVenda || []).forEach(item => {
        if (String(item.produtoId) === String(produtoId)) {
          somaPagina += Number(item.quantidadeVenda || 0);
        }
      });
    });

    return res.status(200).json({
      start: Number(start),
      count: COUNT,
      total: j.total,
      somaPagina,
      proximoStart: Number(start) + COUNT,
      terminou: Number(start) + COUNT >= j.total
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao consultar vendas",
      message: err.message
    });
  }
}
