// utils/cifras.ts

export const NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function transporNota(nota: string, semitones: number): string {
  let n = nota.trim().toUpperCase();
  if (n === "DB") n = "C#";
  if (n === "EB") n = "D#";
  if (n === "GB") n = "F#";
  if (n === "AB") n = "G#";
  if (n === "BB") n = "A#";

  const idx = NOTAS.indexOf(n);
  if (idx === -1) return nota;

  let novoIdx = (idx + semitones) % 12;
  if (novoIdx < 0) novoIdx += 12;
  return NOTAS[novoIdx];
}

// Função matriz definitiva e robusta para transpor qualquer cifra (suporta F7M, Em7, Bm5+, G/B, etc.)
export function transporCifra(texto: string, semitons: number): string {
  if (semitons === 0 || !texto) return texto;

  const linhas = texto.split("\n");

  return linhas
    .map((linha) => {
      if (!linha.trim()) return linha;

      // Mantém secções intactas (ex: [Pré-Refrão])
      if (linha.trim().startsWith("[") && linha.trim().endsWith("]")) {
        return linha;
      }

      const temEspacoDuplo = /\s{2,}/.test(linha);
      const tokens = linha.trim().split(/\s+/);

      // Regex abrangente para identificar com precisão qualquer formato de acorde
      const regexAcorde = /^([A-G][b#]?)(m|maj|min|dim|aug|sus\d?|add\d?|\d+[+\-]?|\d*[M+]?\d*)?(?:\/([A-G][b#]?))?$/i;

      const tokensAcordesValidos = tokens.filter(t => regexAcorde.test(t));
      const pareceLinhaDeAcordes = temEspacoDuplo || (tokensAcordesValidos.length >= tokens.length * 0.6);

      // Se a linha tem texto comum e NÃO tem características de cifra, protege a letra (e a letra "E")
      if (!pareceLinhaDeAcordes && tokens.some(t => /^[a-zá-úãõç]{3,}$/i.test(t))) {
        return linha;
      }

      return linha.replace(
        /\b([A-G][#b]?)([a-zA-Z0-9\+\-\(\)]*)(?:\/([A-G][#b]?))?\b/g,
        (match, notaBase, sufixo = "", baixo) => {
          const notaUpper = notaBase.toUpperCase();
          const notasValidas = ["C", "C#", "DB", "D", "D#", "EB", "E", "F", "F#", "GB", "G", "G#", "AB", "A", "A#", "BB", "B"];
          
          if (!notasValidas.includes(notaUpper)) {
            return match;
          }

          // Proteção extra para a letra "E" solta no início de frases de texto comum
          if (notaUpper === "E" && !sufixo && !baixo && !temEspacoDuplo && tokens.length === 1) {
            return match;
          }

          const sufixoLower = sufixo.toLowerCase();
          const eAcordeValido = 
            sufixo === "" || 
            ["m", "maj", "min", "dim", "aug", "sus", "add", "7", "5", "4", "6", "9", "11", "13", "7m", "7M", "+", "-"].some(s => sufixoLower.includes(s.toLowerCase()));

          if (!eAcordeValido && sufixo !== "") {
            return match;
          }

          const novaBase = transporNota(notaBase, semitons);
          const novoBaixo = baixo ? "/" + transporNota(baixo, semitons) : "";
          return `${novaBase}${sufixo}${novoBaixo}`;
        }
      );
    })
    .join("\n");
}