"use server";

import { revalidatePath } from "next/cache";

const projectId = "app-cifras-bcdce";

// Editar dados básicos do repertório (título e descrição)
export async function editarRepertorioAction(
  repertorioId: string,
  dados: {
    titulo: string;
    descricao: string;
  }
) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}?updateMask.fieldPaths=titulo&updateMask.fieldPaths=descricao`;

  const bodyData = {
    fields: {
      titulo: { stringValue: dados.titulo },
      descricao: { stringValue: dados.descricao },
    },
  };

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      return { sucesso: false, erro: "Erro ao atualizar repertório." };
    }

    revalidatePath("/repertorios");
    revalidatePath(`/repertorios/${repertorioId}`);
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}

// Excluir repertório
export async function excluirRepertorioAction(repertorioId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}`;

  try {
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      return { sucesso: false, erro: "Erro ao excluir repertório." };
    }

    revalidatePath("/repertorios");
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}

// Substituir/Atualizar toda a lista de IDs de músicas do repertório
export async function salvarMusicasDoRepertorioAction(
  repertorioId: string,
  novosMusicasIds: string[]
) {
  const urlPatch = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}?updateMask.fieldPaths=musicasIds`;

  const bodyData = {
    fields: {
      musicasIds: {
        arrayValue: {
          values: novosMusicasIds.map((id) => ({ stringValue: id })),
        },
      },
    },
  };

  try {
    const resPatch = await fetch(urlPatch, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    if (!resPatch.ok) {
      return { sucesso: false, erro: "Erro ao atualizar músicas no banco." };
    }

    revalidatePath(`/repertorios/${repertorioId}`);
    revalidatePath("/repertorios");
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}

// Adicionar uma única música
export async function adicionarMusicaAoRepertorioAction(
  repertorioId: string,
  musicaId: string
) {
  const urlGet = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}`;

  try {
    const res = await fetch(urlGet, { cache: "no-store" });
    if (!res.ok) return { sucesso: false, erro: "Repertório não encontrado." };

    const doc = await res.json();
    const fields = doc.fields || {};

    const musicasAtuais: string[] =
      fields.musicasIds?.arrayValue?.values?.map(
        (v: any) => v.stringValue
      ) || [];

    if (musicasAtuais.includes(musicaId)) {
      return { sucesso: false, erro: "Música já adicionada a este repertório." };
    }

    const novasMusicas = [...musicasAtuais, musicaId];

    const urlPatch = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}?updateMask.fieldPaths=musicasIds`;

    const bodyData = {
      fields: {
        musicasIds: {
          arrayValue: {
            values: novasMusicas.map((id) => ({ stringValue: id })),
          },
        },
      },
    };

    const resPatch = await fetch(urlPatch, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    if (!resPatch.ok) {
      return { sucesso: false, erro: "Erro ao atualizar repertório no servidor." };
    }

    revalidatePath(`/repertorios/${repertorioId}`);
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}

// Remover uma música do repertório
export async function removerMusicaDoRepertorioAction(
  repertorioId: string,
  musicaId: string
) {
  const urlGet = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}`;

  try {
    const res = await fetch(urlGet, { cache: "no-store" });
    if (!res.ok) return { sucesso: false, erro: "Repertório não encontrado." };

    const doc = await res.json();
    const fields = doc.fields || {};

    const musicasAtuais: string[] =
      fields.musicasIds?.arrayValue?.values?.map(
        (v: any) => v.stringValue
      ) || [];

    const novasMusicas = musicasAtuais.filter((id) => id !== musicaId);

    const urlPatch = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}?updateMask.fieldPaths=musicasIds`;

    const bodyData = {
      fields: {
        musicasIds: {
          arrayValue: {
            values: novasMusicas.map((id) => ({ stringValue: id })),
          },
        },
      },
    };

    const resPatch = await fetch(urlPatch, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    if (!resPatch.ok) {
      return { sucesso: false, erro: "Erro ao atualizar repertório." };
    }

    revalidatePath(`/repertorios/${repertorioId}`);
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}

// Reordenar músicas do repertório
export async function reordenarMusicasDoRepertorioAction(
  repertorioId: string,
  novosMusicasIds: string[]
) {
  const urlPatch = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}?updateMask.fieldPaths=musicasIds`;

  const bodyData = {
    fields: {
      musicasIds: {
        arrayValue: {
          values: novosMusicasIds.map((id) => ({ stringValue: id })),
        },
      },
    },
  };

  try {
    const resPatch = await fetch(urlPatch, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    if (!resPatch.ok) {
      return { sucesso: false, erro: "Erro ao reordenar músicas no banco." };
    }

    revalidatePath(`/repertorios/${repertorioId}`);
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}