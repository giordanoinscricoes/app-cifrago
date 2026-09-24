"use server";

export async function criarMusicaAction(data: {
  titulo: string;
  artista: string;
  tomOriginal: string;
  cifra: string;
  userId: string; // <--- 1. Receber o userId
}) {
  const projectId = "app-cifras-bcdce";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas`;

  const bodyData = {
    fields: {
      titulo: { stringValue: data.titulo },
      artista: { stringValue: data.artista },
      tomOriginal: { stringValue: data.tomOriginal },
      tomAtual: { stringValue: data.tomOriginal },
      cifra: { stringValue: data.cifra },
      userId: { stringValue: data.userId || "" }, // <--- 2. Gravar o userId no Firestore
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
      console.error("Erro na REST API do Firestore:", erroJson);
      return {
        sucesso: false,
        erro: erroJson.error?.message || "Erro ao salvar no Firestore.",
      };
    }

    return { sucesso: true };
  } catch (erro: any) {
    console.error("Erro de conexão na Server Action:", erro);
    return { sucesso: false, erro: erro?.message || "Erro de rede ao salvar." };
  }
}