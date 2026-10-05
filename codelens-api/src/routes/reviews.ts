// =====================================================
// ROTAS DE REVIEWS — O "Departamento de Análises"
// =====================================================
// Este arquivo contém as rotas (endpoints) relacionadas
// à análise de código. Cada rota é como um "balcão de atendimento"
// com uma função específica.

import { Hono } from 'hono';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReviewRequestSchema } from '../schemas';
import type { ReviewResponse } from '../schemas';

// Declaramos as variáveis de ambiente que o Worker espera receber
type Bindings = {
  GEMINI_API_KEY: string;
};

// Criamos um "mini-app" Hono tipado com nossas variáveis de ambiente
export const reviewRoutes = new Hono<{ Bindings: Bindings }>();

// =====================================================
// POST /api/reviews — Analisar Código
// =====================================================
// Quando o frontend manda um código para ser analisado,
// essa rota é acionada. O fluxo é:
// 1. Recebe o JSON do frontend
// 2. Valida com o Zod (o porteiro)
// 3. Envia para a IA (por enquanto simulado)
// 4. Devolve o resultado
reviewRoutes.post('/', async (c) => {

  // --- PASSO 1: Pegar o corpo da requisição ---
  // O "body" é o pacote de dados que o frontend enviou.
  // Usamos await porque ler o corpo é uma operação assíncrona.
  const body = await c.req.json();

  // --- PASSO 2: Validar com o Zod ---
  // safeParse = "tente validar sem explodir se der erro"
  // Se os dados estiverem errados, ele retorna { success: false, error: ... }
  // Se estiverem corretos, retorna { success: true, data: ... }
  const validation = ReviewRequestSchema.safeParse(body);

  // Se a validação FALHOU, devolvemos um erro 400 (Bad Request)
  // explicando exatamente o que o frontend mandou de errado.
  if (!validation.success) {
    return c.json({
      error: 'Dados inválidos',
      details: validation.error.issues.map(issue => ({
        campo: issue.path.join('.'),    // Qual campo deu erro (ex: "code")
        mensagem: issue.message          // O que está errado (ex: "não pode ser vazio")
      }))
    }, 400); // 400 = "Requisição Malformada"
  }

  // --- PASSO 3: Dados validados! Podemos usar com segurança ---
  const { code, language } = validation.data;

  // --- PASSO 4: Enviar para o Google Gemini (IA REAL) ---
  try {
    // Inicializa o cliente do Gemini usando a chave de API que vem do ambiente (env)
    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
    // Usamos o modelo gemini-3.8-flash, que é muito rápido e barato
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    // Montamos o "prompt" (instruções precisas para a IA)
    const prompt = `
Você é um desenvolvedor sênior especialista em Clean Code. 
Faça um Code Review estrito do seguinte código escrito em ${language}.

Sua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON válido, sem markdown, sem explicações extras. O formato exato do JSON deve ser:
{
  "score": número de 0.0 a 10.0 (onde 10 é código perfeito),
  "vulnerabilities": ["lista", "de", "problemas", "ou falhas de segurança"],
  "suggestions": ["lista", "de", "sugestões", "de", "melhoria"]
}

Código para análise:
\`\`\`${language}
${code}
\`\`\`
    `;

    // Chamamos a IA
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Limpeza de resposta (a IA pode acabar colocando \`\`\`json em volta)
    text = text.replace(/^```json/g, '').replace(/```$/g, '').trim();
    
    // Transformamos o texto JSON devolvido pela IA em um objeto JavaScript real
    const aiResponse: ReviewResponse = JSON.parse(text);

    // --- PASSO 5: Devolver o resultado ---
    return c.json({
      success: true,
      data: aiResponse,
      analyzedAt: new Date().toISOString()
    });
    
  } catch (err: any) {
    console.error("Erro na API do Gemini:", err);
    return c.json({ error: 'Erro ao processar a análise com a IA', details: err.message }, 500);
  }
});

// =====================================================
// GET /api/reviews — Listar Histórico (futuro)
// =====================================================
// Quando tivermos o banco de dados (Drizzle + PostgreSQL),
// essa rota vai buscar o histórico de análises do usuário.
reviewRoutes.get('/', (c) => {
  return c.json({
    message: 'Histórico ainda não implementado. Em breve com Drizzle + PostgreSQL!',
    data: []
  });
});

// =====================================================
// FUNÇÃO AUXILIAR: Gerador de Review Simulado
// =====================================================
// Essa função analisa o código de forma básica (sem IA)
// para que possamos testar o frontend enquanto não
// conectamos a OpenAI.
function generateMockReview(code: string, language: string): ReviewResponse {
  const vulnerabilities: string[] = [];
  const suggestions: string[] = [];

  // Detecções simples baseadas em padrões de texto
  if (code.includes('any')) {
    vulnerabilities.push('Uso de "any" detectado — reduz a segurança de tipos');
  }
  if (code.includes('console.log')) {
    vulnerabilities.push('console.log encontrado — remover antes de ir para produção');
  }
  if (!code.includes('try') && (code.includes('fetch') || code.includes('await'))) {
    vulnerabilities.push('Código assíncrono sem tratamento de erro (try/catch ausente)');
  }
  if (code.includes('var ')) {
    vulnerabilities.push('Uso de "var" — prefira "const" ou "let" para escopo seguro');
  }
  if (code.length > 500 && !code.includes('function') && !code.includes('=>')) {
    suggestions.push('Código extenso sem funções — considere dividir em funções menores');
  }

  // Sugestões gerais
  suggestions.push('Considere adicionar tipagem explícita para melhor manutenibilidade');
  if (language === 'javascript') {
    suggestions.push('Considere migrar para TypeScript para maior segurança de tipos');
  }
  suggestions.push('Adicione comentários explicativos em trechos complexos');

  // Calcula a nota baseada nas vulnerabilidades encontradas
  const score = Math.max(0, Math.min(10, 10 - vulnerabilities.length * 1.5));

  return {
    score: Math.round(score * 10) / 10, // Arredonda para 1 casa decimal
    vulnerabilities,
    suggestions,
  };
}
