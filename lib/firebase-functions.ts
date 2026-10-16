import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  getDoc,
  updateDoc 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getUserRole, getPermissions, isAdmin } from "@/lib/auth";

/**
 * ==========================================
 * MÚSICAS
 * ==========================================
 */

/**
 * Retorna as músicas permitidas para o utilizador logado (Próprias, Partilhadas ou Globais para Admin).
 */
export async function serviceGetMusicas() {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const musicasRef = collection(db, "musicas");
  
  // Buscamos todas as músicas e aplicamos a segurança e filtros no código,
  // garantindo que músicas partilhadas via 'compartilhadoCom' sejam incluídas.
  const snapshot = await getDocs(query(musicasRef));
  
  const emailUser = currentUser.email?.toLowerCase().trim() || "";
  const admin = isAdmin(currentUser);

  const musicasPermitidas: any[] = [];

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const criadoPor = (data.criadoPor || data.email || "").toLowerCase().trim();
    const compartilhadoCom = (data.compartilhadoCom || []).map((e: string) => e.toLowerCase().trim());

    const eDono = criadoPor === emailUser || data.userId === currentUser.uid;
    const eCompartilhado = compartilhadoCom.includes(emailUser);

    if (admin || eDono || eCompartilhado) {
      musicasPermitidas.push({
        id: docSnap.id,
        ...data
      });
    }
  });

  return musicasPermitidas;
}

/**
 * Apaga uma música garantindo que respeita as regras de permissão.
 */
export async function serviceDeletarMusica(idMusica: string, donoIdMusica: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Utilizador não autenticado.");

  const role = await getUserRole(currentUser);
  const permissions = getPermissions(role);

  if (!permissions.canModifyContent) {
    throw new Error("Não tens permissão para excluir conteúdos.");
  }

  if (!permissions.canViewGlobalLibrary && currentUser.uid !== donoIdMusica) {
    throw new Error("Só podes apagar registos criados por ti.");
  }

  await deleteDoc(doc(db, "musicas", idMusica));
}

/**
 * ==========================================
 * REPERTÓRIOS
 * ==========================================
 */

/**
 * Retorna os repertórios permitidos para o utilizador logado (Próprios, Partilhados ou Globais para Admin).
 */
export async function serviceGetRepertorios() {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const repertoriosRef = collection(db, "repertorios");
  const snapshot = await getDocs(query(repertoriosRef));
  
  const emailUser = currentUser.email?.toLowerCase().trim() || "";
  const admin = isAdmin(currentUser);

  const repertoriosPermitidos: any[] = [];

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const criadoPor = (data.criadoPor || data.email || "").toLowerCase().trim();
    const compartilhadoCom = (data.compartilhadoCom || []).map((e: string) => e.toLowerCase().trim());

    const eDono = criadoPor === emailUser || data.userId === currentUser.uid;
    const eCompartilhado = compartilhadoCom.includes(emailUser);

    if (admin || eDono || eCompartilhado) {
      repertoriosPermitidos.push({
        id: docSnap.id,
        ...data
      });
    }
  });

  return repertoriosPermitidos;
}

/**
 * Apaga um repertório garantindo que respeita as regras de permissão.
 */
export async function serviceDeletarRepertorio(idRepertorio: string, donoIdRepertorio: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Utilizador não autenticado.");

  const role = await getUserRole(currentUser);
  const permissions = getPermissions(role);

  if (!permissions.canModifyContent) {
    throw new Error("Não tens permissão para excluir conteúdos.");
  }

  if (!permissions.canViewGlobalLibrary && currentUser.uid !== donoIdRepertorio) {
    throw new Error("Só podes apagar registos criados por ti.");
  }

  await deleteDoc(doc(db, "repertorios", idRepertorio));
}

/**
 * Retorna os dados de um repertório específico pelo ID.
 */
export async function serviceGetRepertorioPorId(idRepertorio: string) {
  const docRef = doc(db, "repertorios", idRepertorio);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Atualiza os dados de um repertório (título, descrição, músicas e criadoPor).
 */
export async function serviceAtualizarRepertorio(
  idRepertorio: string, 
  dados: { titulo?: string; descricao?: string; musicasIds?: string[]; criadoPor?: string }
) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Utilizador não autenticado.");

  const role = await getUserRole(currentUser);
  const permissions = getPermissions(role);

  if (!permissions.canModifyContent) {
    throw new Error("Não tens permissão para editar conteúdos.");
  }

  const docRef = doc(db, "repertorios", idRepertorio);
  
  const dadosAtualizacao: any = {};
  if (dados.titulo !== undefined) dadosAtualizacao.titulo = dados.titulo;
  if (dados.descricao !== undefined) dadosAtualizacao.descricao = dados.descricao;
  if (dados.musicasIds !== undefined) dadosAtualizacao.musicasIds = dados.musicasIds;
  
  // Atualiza ou insere o criadoPor com base no utilizador atual ou no passado
  dadosAtualizacao.criadoPor = dados.criadoPor || currentUser.email || "";

  await updateDoc(docRef, dadosAtualizacao);
}

/**
 * Retorna todas as músicas permitidas.
 */
export async function serviceGetTodasMusicas() {
  return serviceGetMusicas();
}