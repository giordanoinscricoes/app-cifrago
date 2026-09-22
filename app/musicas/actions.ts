"use server";

import { revalidatePath } from "next/cache";

const PROJECT_ID = "app-cifras-bcdce";

export async function salvarOrdemMusicasAction(musicasOrdenadas: { id: string }[]) {
  try {
    // Atualiza o campo 'ordem' no Firestore para cada música na nova sequência
    for (let i = 0; i < musicasOrdenadas.length; i++) {
      const m = musicasOrdenadas[i];
      const urlPatch = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/musicas/${m.id}?updateMask.fieldPaths=ordem`;

      await fetch(urlPatch, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            ordem: { integerValue: i },
          },
        }),
      });
    }

    revalidatePath("/musicas");
    return { sucesso: true };
  } catch (erro: any) {
    console.error("Erro ao guardar ordem das músicas:", erro);
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}