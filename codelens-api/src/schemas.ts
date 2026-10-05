// =====================================================
// ZOD SCHEMAS — Os "Contratos" de Dados
// =====================================================
// O Zod é como um PORTEIRO da nossa API.
// Antes de qualquer dado entrar no sistema, o Zod verifica:
// "Esse dado está no formato correto? Tem tudo que eu preciso?"
// Se não estiver, ele BARRA na porta e retorna um erro.

import { z } from 'zod';

// --- Schema de Entrada (o que o frontend PRECISA enviar) ---
// Isso é um "contrato": o frontend TEM que mandar um objeto com
// exatamente esses campos, nesses formatos, senão é barrado.
export const ReviewRequestSchema = z.object({
  // O código que o usuário quer analisar
  // .min(1) = "precisa ter pelo menos 1 caractere" (não pode ser vazio)
  // .max(10000) = "no máximo 10.000 caracteres" (para não abusar da IA)
  code: z
    .string({ required_error: 'O campo "code" é obrigatório' })
    .min(1, 'O código não pode ser vazio')
    .max(10000, 'O código não pode ter mais de 10.000 caracteres'),

  // A linguagem de programação do código
  // .enum() = "só aceito ESSES valores, nada mais"
  language: z.enum(
    ['javascript', 'typescript', 'python', 'java'],
    { required_error: 'O campo "language" é obrigatório' }
  ),
});

// --- Schema de Saída (o que a API vai DEVOLVER) ---
// Esse contrato define o formato da resposta que a IA nos dá.
export const ReviewResponseSchema = z.object({
  // Nota de 0 a 10
  score: z.number().min(0).max(10),

  // Lista de problemas encontrados
  vulnerabilities: z.array(z.string()),

  // Lista de sugestões de melhoria
  suggestions: z.array(z.string()),
});

// --- Tipos TypeScript gerados automaticamente ---
// O Zod consegue "extrair" um tipo TypeScript a partir do schema.
// Assim, a gente não precisa escrever o tipo E o validador separados.
// É um 2-em-1!
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
