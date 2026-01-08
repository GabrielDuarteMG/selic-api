import ky from "ky";
const PERMA_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjcwNDI2MTYsImV4cCI6NDc2NzA0MjczNn0.FxCuh6QMraJM8ruO95Eub4uzXoVu_fiQKsvV7j1CH-k";

export const sendToAi = async (prompt) => {
  try {
    const response = await ky
      .post("https://sider.gabmicka.com.br/chat", {
        json: {
          prompt,
          config: { model: "gpt-5-mini" },
        },
        headers: {
          Authorization: `Bearer ${PERMA_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      })
      .json();
    return response;
  } catch (error) {
    let details = undefined;
    if (error.response) {
      try {
        details = await error.response.json();
      } catch {
        details = await error.response.text().catch(() => undefined);
      }
    }
    console.error(
      "[sider-client] Erro ao enviar prompt para o Sider:",
      details || error.message
    );
    throw error;
  }
};
