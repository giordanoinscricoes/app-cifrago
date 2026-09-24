import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Email definido temporariamente como Administrador Principal
const ADMIN_EMAIL = "giordano.machado@gmail.com";

export type UserRole = 'admin' | 'viewer' | 'private';

export interface UserPermissions {
  canManageSettings: boolean;      // Acesso a configurações e painel de admin
  canViewGlobalLibrary: boolean;   // Vê todas as músicas/repertórios de todos
  canModifyContent: boolean;       // Pode criar, editar ou excluir registos
}

/**
 * Retorna as permissões com base no papel (role) do utilizador.
 */
export function getPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        canManageSettings: true,
        canViewGlobalLibrary: true,
        canModifyContent: true,
      };
      
    case 'viewer':
      return {
        canManageSettings: false,
        canViewGlobalLibrary: true,  // Vê toda a biblioteca
        canModifyContent: false,     // Sem permissão para incluir/excluir
      };
      
    case 'private':
    default:
      return {
        canManageSettings: false,
        canViewGlobalLibrary: false, // Vê apenas os seus próprios dados
        canModifyContent: true,      // Gere o seu próprio conteúdo
      };
  }
}

/**
 * Verifica se o utilizador autenticado é administrador (mantém a compatibilidade com o teu código atual).
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Busca o papel (role) do utilizador no Firestore. 
 * Se for o teu email principal, assume sempre 'admin' por segurança.
 */
export async function getUserRole(user: User | null): Promise<UserRole> {
  if (!user || !user.email) return 'private';

  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return 'admin';
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return (data.role as UserRole) || 'private';
    }
  } catch (error) {
    console.error("Erro ao buscar o papel do utilizador:", error);
  }

  return 'private'; // Por defeito, novos utilizadores são private
}