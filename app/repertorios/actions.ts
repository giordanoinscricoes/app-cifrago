"use server";

import { revalidatePath } from "next/cache";

const PROJECT_ID = "app-cifras-bcdce";

export async function salvarOrdemRepertoriosAction(repertoriosOrdenados: { id: string }[]) {
  try {
    // Atualiza o campo 'ordem' no Firestore para cada repertório da lista
    for (let i = 0; i < repertoriosOrdenados.length; i++) {
      const rep = repertoriosOrdenados[i];
      const urlPatch = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/repertorios/${rep.id}?updateMask.fieldPaths=ordem`;

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

    revalidatePath("/repertorios");
    return { sucesso: true };
  } catch (erro: any) {
    console.error("Erro ao guardar ordem dos repertórios:", erro);
    return { sucesso: false, erro: erro?.message || "Erro de conexão." };
  }
}