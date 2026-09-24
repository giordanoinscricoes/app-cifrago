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
import { getUserRole, getPermissions } from "@/lib/auth";

/**
 * ==========================================
 * MÚSICAS
 * ==========================================
 */

/**
 * Retorna as músicas com base automática nas permissões do utilizador logado.
 */
export async function serviceGetMusicas() {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const role = await getUserRole(currentUser);
  const permissions = getPermissions(role);

  const musicasRef = collection(db, "musicas");
  let q;

  if (permissions.canViewGlobalLibrary) {
    q = query(musicasRef);
  } else {
    q = query(musicasRef, where("userId", "==", currentUser.uid));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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
 * Retorna os repertórios com base automática nas permissões do utilizador logado.
 */
export async function serviceGetRepertorios() {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const role = await getUserRole(currentUser);
  const permissions = getPermissions(role);

  const repertoriosRef = collection(db, "repertorios");
  let q;

  if (permissions.canViewGlobalLibrary) {
    q = query(repertoriosRef);
  } else {
    q = query(repertoriosRef, where("userId", "==", currentUser.uid));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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
 * Atualiza os dados de um repertório (título, descrição e/ou músicas).
 */
export async function serviceAtualizarRepertorio(
  idRepertorio: string, 
  dados: { titulo?: string; descricao?: string; musicasIds?: string[] }
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

  await updateDoc(docRef, dadosAtualizacao);
}

/**
 * Retorna todas as músicas (global ou filtrada por utilizador, conforme permissão).
 */
export async function serviceGetTodasMusicas() {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const role = await getUserRole(currentUser);
  const permissions = getPermissions(role);

  const musicasRef = collection(db, "musicas");
  let q;

  if (permissions.canViewGlobalLibrary) {
    q = query(musicasRef);
  } else {
    q = query(musicasRef, where("userId", "==", currentUser.uid));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}