"use server";

import { revalidatePath } from "next/cache";

const projectId = "app-cifras-bcdce";

export async function editarMusicaAction(
  musicaId: string,
  dados: {
    titulo: string;
    artista: string;
    tomOriginal: string;
    cifra: string;
  }
) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas/${musicaId}?updateMask.fieldPaths=titulo&updateMask.fieldPaths=artista&updateMask.fieldPaths=tomOriginal&updateMask.fieldPaths=cifra`;

  const bodyData = {
    fields: {
      titulo: { stringValue: dados.titulo },
      artista: { stringValue: dados.artista },
      tomOriginal: { stringValue: dados.tomOriginal },
      cifra: { stringValue: dados.cifra },
    },
  };

  try {
    const resposta = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    if (!resposta.ok) {
      return { sucesso: false, erro: "Erro ao atualizar a música no banco de dados." };
    }

    revalidatePath("/musicas");
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}

export async function excluirMusicaAction(musicaId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas/${musicaId}`;

  try {
    const resposta = await fetch(url, {
      method: "DELETE",
    });

    if (!resposta.ok) {
      return { sucesso: false, erro: "Erro ao excluir a música." };
    }

    revalidatePath("/musicas");
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}

// --- FUNÇÃO BUSCAR MUSICA POR ID ACTION ---

export async function buscarMusicaPorIdAction(musicaId: string) {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas/${musicaId}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return { sucesso: false, erro: "Música não encontrada." };
    }

    const doc = await res.json();
    const f = doc.fields || {};

    return {
      sucesso: true,
      musica: {
        id: musicaId,
        titulo: f.titulo?.stringValue || "Sem título",
        artista: f.artista?.stringValue || "Artista desconhecido",
        tomOriginal: f.tomOriginal?.stringValue || "C",
        cifra: f.cifra?.stringValue || f.conteudo?.stringValue || "",
      },
    };
  } catch (erro: any) {
    console.error("Erro ao buscar música no servidor:", erro);
    return { sucesso: false, erro: "Erro de conexão ao carregar a música." };
  }
}