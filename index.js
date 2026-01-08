// index.js
import express from "express";
import ky from "ky";
import { encode } from "@toon-format/toon";
import { sendToAi } from "./sider-api.js";

const app = express();
const port = 7542;

const API_1 = "	https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros";

app.get("/selic-status", async (req, res) => {
  try {
    const searchParams = req.query;

    const response = await ky
      .get(API_1, { searchParams, timeout: 10_000 })
      .json();

    const ultimas12TaxasSelic = response.conteudo
      .sort(
        (a, b) => new Date(b.DataReuniaoCopom) - new Date(a.DataReuniaoCopom)
      )
      .slice(0, 12);
    const hash = hashSelicResponse(ultimas12TaxasSelic);
    const encoded = encode(ultimas12TaxasSelic);
    const { response: responseAi } = await sendToAi(
      `Analise as taxas Selic e responda em até 200 caracteres. Diga se 'subiu', 'caiu' ou 'mesma' em relação ao mês passado. Inclua, se possível, os valores antigos→novos: ${encoded}`
    );
    res.json({ analise: responseAi, hash });
  } catch (err) {
    const status = err?.response?.status || 502;
    const details = await err?.response?.text?.().catch(() => undefined);

    res.status(status).json({
      error: "upstream_failed",
      status,
      message: err?.message,
      details,
    });
  }
});
app.get("/selic-history", async (req, res) => {
  try {
    const response = await ky.get(API_1, { timeout: 10_000 }).json();
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/selic-hash", async (req, res) => {
  try {
    const response = await ky.get(API_1, { timeout: 10_000 }).json();
    const ultimas12TaxasSelic = response.conteudo
      .sort(
        (a, b) => new Date(b.DataReuniaoCopom) - new Date(a.DataReuniaoCopom)
      )
      .slice(0, 12);
    const hash = hashSelicResponse(ultimas12TaxasSelic);
    res.json({ hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/", async (req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
  });
});
app.listen(port, "0.0.0.0", () =>
  console.log(`listening on http://0.0.0.0:${port}`)
);

function hashSelicResponse(responseSelic) {
  if (Array.isArray(responseSelic)) {
    return responseSelic
      .map((item) => `${item.NumeroReuniaoCopom || ""}:${item.MetaSelic || ""}`)
      .join("|");
  }

  return String(responseSelic);
}
