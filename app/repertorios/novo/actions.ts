"use server";

export async function criarRepertorioAction(data: {
  titulo: string;
  descricao?: string;
  dataEvento?: string;
}) {
  const projectId = "app-cifras-bcdce";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios`;

  const bodyData = {
    fields: {
      titulo: { stringValue: data.titulo },
      descricao: { stringValue: data.descricao || "" },
      dataEvento: { stringValue: data.dataEvento || "" },
      criado_em: { timestampValue: new Date().toISOString() },
    },
  };

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    if (!resposta.ok) {
      const erroJson = await resposta.json();
      console.error("Erro na REST API do Firestore (Repertórios):", erroJson);
      return {
        sucesso: false,
        erro: erroJson.error?.message || "Erro ao salvar o repertório no Firestore.",
      };
    }

    return { sucesso: true };
  } catch (erro: any) {
    console.error("Erro de conexão na Server Action:", erro);
    return { sucesso: false, erro: erro?.message || "Erro de rede ao salvar repertório." };
  }
}