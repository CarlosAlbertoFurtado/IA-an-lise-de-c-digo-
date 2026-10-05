// =====================================================
// CODELENS API — Arquivo Principal (Ponto de Entrada)
// =====================================================
// Este é o "portão de entrada" da nossa API.
// Toda requisição que chegar ao nosso servidor, passa por aqui primeiro.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { reviewRoutes } from './routes/reviews';

type Bindings = {
  GEMINI_API_KEY: string;
};

// --- Criando a aplicação Hono ---
// Pense no Hono como se fosse o Express (que você já conhece),
// mas feito para rodar em Cloudflare Workers (na "Edge").
const app = new Hono<{ Bindings: Bindings }>();

// --- Middleware: CORS ---
// CORS = Cross-Origin Resource Sharing (Compartilhamento de Recursos entre Origens).
// Sem isso, o nosso frontend (que roda em localhost:5173) NÃO conseguiria
// conversar com o nosso backend (que roda em localhost:8787).
// O navegador bloqueia isso por segurança. O CORS "abre a porta" para o frontend.
app.use('/*', cors({
  origin: '*', // Em produção, trocaríamos por 'https://codelens.com'
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type'],
}));

// --- Rota de Saúde (Health Check) ---
// Uma rota simples para verificar se a API está no ar.
// Se alguém acessar "http://localhost:8787/", recebe essa resposta.
app.get('/', (c) => {
  return c.json({
    status: 'online',
    message: '🚀 CodeLens API está rodando!',
    version: '1.0.0'
  });
});

// --- Conectando as Rotas de Reviews ---
// Toda rota que começar com "/api/reviews" será tratada pelo arquivo reviews.ts
app.route('/api/reviews', reviewRoutes);

// --- Exportando a aplicação ---
// Essa linha é OBRIGATÓRIA para o Cloudflare Workers saber
// que essa é a aplicação que ele precisa rodar.
export default app;
