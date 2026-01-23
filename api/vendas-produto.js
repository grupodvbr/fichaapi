export default async function handler(req, res) {
  try {
    const { produtoId, de, ate, start } = req.query;

    if (!produtoId || !de || !ate) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios: produtoId, de, ate"
      });
    }

    const START = Number(start || 0);
    const COUNT = 50;

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

    const authRaw = await authResp.text();

    if (!authResp.ok) {
      return res.status(500).json({
        error: "Erro ao autenticar no Varejo Fácil",
        raw: authRaw
      });
    }

    const authJson = JSON.parse(authRaw);
    const token = authJson.accessToken;

    /* =========================
       2️⃣ BUSCA CUPONS FISCAIS
    ========================= */
    const url =
      `https://mercatto.varejofacil.com/api/v1/venda/cupons-fiscais` +
      `?start=${START}` +
      `&count=${COUNT}` +
      `&dataVendaInicial=${de}` +
      `&dataVendaFinal=${ate}`;

    const vendaResp = await fetch(url, {
      headers: {
        Authorization: `${token}`,
        Accept: "application/json"
      }
    });

    if (!vendaResp.ok) {
      const t = await vendaResp.text();
      return res.status(500).json({
        error: "Erro ao consultar vendas",
        detalhe: t
      });
    }

    const vendaJson = await vendaResp.json();

    /* =========================
       3️⃣ SOMA EXATA DO PRODUTO
    ========================= */
    let somaPagina = 0;

    for (const cupom of vendaJson.items || []) {
      for (const item of cupom.itensVenda || []) {
        if (Number(item.produtoId) === Number(produtoId)) {
          somaPagina += Number(item.quantidadeVenda || 0);
        }
      }
    }

    /* =========================
       4️⃣ CONTROLE DE PROGRESSO
    ========================= */
    const totalRegistros = vendaJson.total || 0;
    const proximoStart = START + COUNT;
    const terminou = proximoStart >= totalRegistros;

    const progresso = totalRegistros
      ? Math.min(100, Math.round((proximoStart / totalRegistros) * 100))
      : 100;

    /* =========================
       5️⃣ RETORNO PADRONIZADO
    ========================= */
    return res.status(200).json({
      somaPagina,          // soma dessa página
      startAtual: START,
      proximoStart,
      totalRegistros,
      progresso,           // % concluído
      terminou
    });

  } catch (err) {
    console.error("ERRO vendas-produto:", err);
    return res.status(500).json({
      error: "Erro interno",
      message: err.message
    });
  }
}
