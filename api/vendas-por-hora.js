export default async function handler(req, res) {
  try {
    const { produtoId, de, ate } = req.query;

    if (!de || !ate) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios: de, ate"
      });
    }

    const COUNT = 200;
    let start = 0;
    let terminou = false;

    const porHora = Array.from({ length: 24 }, (_, h) => ({
      hora: h,
      quantidade: 0,
      valor: 0
    }));

    /* =========================
       1️⃣ AUTENTICAÇÃO VF
    ========================= */
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Usuario>
  <username>NALBERT SOUZA</username>
  <password>99861</password>
</Usuario>`;

    const authResp = await fetch(
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

    const authJson = JSON.parse(await authResp.text());
    const token = authJson.accessToken;

    /* =========================
       2️⃣ LOOP CUPONS
    ========================= */
    while (!terminou) {

      const url =
        `https://mercatto.varejofacil.com/api/v1/venda/cupons-fiscais` +
        `?start=${start}` +
        `&count=${COUNT}` +
        `&dataVendaInicial=${de}` +
        `&dataVendaFinal=${ate}`;

      const vendaResp = await fetch(url, {
        headers: {
          Authorization: token,
          Accept: "application/json"
        }
      });

      const vendaJson = await vendaResp.json();

      for (const cupom of vendaJson.items || []) {

        const data = new Date(cupom.dataVenda);
        const hora = data.getHours();

        for (const item of cupom.itensVenda || []) {

          if (produtoId && Number(item.produtoId) !== Number(produtoId)) {
            continue;
          }

          const qtd =
            Number(item.quantidade) ||
            Number(item.qtd) ||
            Number(item.qtdItem) ||
            Number(item.quantidadeItem) ||
            0;

          const valor =
            Number(item.valorTotal) ||
            Number(item.valor) ||
            0;

          porHora[hora].quantidade += qtd;
          porHora[hora].valor += valor;
        }
      }

      start += COUNT;
      terminou = start >= (vendaJson.total || 0);
    }

    /* =========================
       3️⃣ RETORNO
    ========================= */
    return res.status(200).json({
      de,
      ate,
      produtoId: produtoId || null,
      porHora
    });

  } catch (err) {
    console.error("ERRO vendas-por-hora:", err);
    return res.status(500).json({
      error: "Erro interno",
      message: err.message
    });
  }
}
