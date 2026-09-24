import { User } from "firebase/auth";

// Email definido temporariamente como Administrador Principal
const ADMIN_EMAIL = "giordano.machado@gmail.com";

/**
 * Verifica se o utilizador autenticado é administrador.
 * No futuro, esta função poderá consultar a base de dados (Firestore) 
 * em vez de verificar apenas o email estático.
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}