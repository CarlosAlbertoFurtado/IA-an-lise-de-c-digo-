# 📖 Documentação Técnica Oficial: CodeLens AI

Esta documentação fornece uma visão profunda da arquitetura, stack tecnológico, decisões de design e escalabilidade do projeto **CodeLens AI**, desenhada para suportar milhões de usuários de forma resiliente e com alta performance.

---

## 1. Visão Geral da Arquitetura
O CodeLens foi construído sobre uma arquitetura **Serverless (Edge Computing)** baseada em microsserviços desacoplados. 
Temos a separação clara de responsabilidades (Separation of Concerns):
- **Frontend (Client-Side / SSR):** Responsável apenas pela camada de apresentação, interatividade e experiência do usuário (UX).
- **Backend (API / Edge):** Responsável pela regra de negócio, validação de dados, comunicação com a Inteligência Artificial e (no futuro) persistência de dados.

O fato de estarem separados permite que o frontend seja hospedado em uma CDN (como Vercel ou Cloudflare Pages) e o backend rode em dezenas de datacenters globais simultaneamente (Cloudflare Workers), garantindo latência quase zero.

---

## 2. Stack Tecnológico (O que usamos e por quê?)

### 🌐 Frontend
- **SvelteKit (Svelte 5):** Escolhido por não usar Virtual DOM, compilando o código diretamente para JavaScript puro. Isso resulta em pacotes menores, renderização extremamente rápida e menor consumo de bateria no dispositivo do usuário. Usamos as novas *Runes* (`$state`) para reatividade granular.
- **Tailwind CSS:** Para estilização utilitária. Permite construir interfaces escaláveis, mantendo o arquivo CSS gerado minúsculo, o que melhora o LCP (Largest Contentful Paint) no SEO.

### ⚙️ Backend
- **Cloudflare Workers:** Execução Serverless na "Edge". O código não roda em um servidor centralizado (ex: AWS em São Paulo), ele roda no datacenter mais próximo do usuário final (se o usuário está no Japão, roda no Japão). 
- **Hono:** Um framework web super leve (semelhante ao Express), construído especificamente para rodar na Edge (Workers/Deno/Bun) com tipagem total e roteamento extremamente rápido.
- **Zod:** Biblioteca de validação e declaração de Schemas em TypeScript. Atua como um "Porteiro Estrito", garantindo que nenhum dado malicioso ou malformado quebre a API.
- **TypeScript:** Utilizado ponta a ponta (End-to-End Type Safety), garantindo que os contratos de dados entre Front e Back sejam respeitados em tempo de compilação.
- **Google Gemini API (@google/generative-ai):** LLM (Large Language Model) super veloz (`gemini-3.8-flash`) focado em análises rápidas e econômicas.

---

## 3. A Lógica: Fluxo de Vida de uma Requisição

Quando o usuário clica em "Analisar Código", o seguinte fluxo ocorre em milissegundos:

1. **Interação (Svelte):** A função `analyzeCode` (no Frontend) muda o estado para `isLoading = true`, travando o botão para evitar duplos cliques (Prevenção de Flood).
2. **Transporte HTTP:** O Frontend dispara um `POST` via `fetch` para o backend (`/api/reviews`), serializando o código para JSON.
3. **Entrada e Validação (API):**
   - A requisição bate no **Hono**. O Middleware de CORS autoriza a origem.
   - O payload entra no validador do **Zod** (`ReviewRequestSchema.safeParse`).
   - Se o usuário mandou um código vazio ou uma linguagem não suportada, a requisição morre aqui, economizando recursos de rede e custos de IA. Retorna `400 Bad Request`.
4. **Processamento LLM (Gemini):**
   - Os dados aprovados são injetados em um **Prompt de Engenharia Estrita**. O modelo recebe ordens para atuar como um Arquiteto de Software sênior.
   - A chamada é feita via pacote oficial do Google.
5. **Tratamento de Falhas (Graceful Degradation):**
   - Se o Google demorar, cair ou sobrecarregar (Erro 503), o bloco `catch` é acionado.
   - O sistema entra no "Plano B" (Mock Function), gera uma análise local (Regex-based) e adiciona um aviso para o usuário. A tela **nunca quebra**.
6. **Resposta e Deserialização:** O Backend retorna um HTTP 200 (OK) com o JSON contendo `score`, `vulnerabilities` e `suggestions`.
7. **Renderização:** O Svelte injeta os dados nos Cards (`result.vulnerabilities`) atualizando o DOM apenas onde foi modificado.

---

## 4. O Sistema é Escalável para Milhões de Pessoas?

**SIM.** O sistema foi desenhado para **Hiperescalabilidade**, ou seja, ele aguenta do zero a milhões de acessos sem precisar de intervenção manual (como reiniciar servidores ou alugar máquinas maiores).

Os motivos técnicos que garantem a escala:

1. **Ausência de Servidor Tradicional (Serverless):** Não existe um servidor Node.js (EC2/Droplet) rodando 24/7. O Cloudflare Workers "acorda" em 0 milissegundos quando há uma requisição, executa o script e "dorme". Se tivermos 1 milhão de usuários simultâneos, a Cloudflare instantaneamente aloca 1 milhão de instâncias independentes em paralelo. Sem gargalos de CPU/Memória centrais.
2. **Stateless (Sem Estado):** A rota de `/api/reviews` não guarda informações na memória (variáveis globais). Cada requisição é única, começa e termina. Isso permite que qualquer servidor no mundo atenda qualquer usuário.
3. **Validação na Borda (Zod):** Como validamos o tipo de dados logo na entrada da requisição, hackers mandando payloads gigantes ou malformados não conseguem atingir a IA nem travar o processamento pesado. O Zod descarta o lixo quase de graça.
4. **Resiliência (Fallback):** Mesmo que a API do Google saia do ar por ter milhões de acessos, seu app não fica fora do ar (graças ao *Graceful Degradation* que implementamos).

---

## 5. Boas Práticas Implementadas

Ao construir o app, adotamos práticas consagradas da engenharia de software global:

- **Fail-Fast (Falhe Rápido):** O sistema não tenta processar se os dados estiverem errados. Ele barra na porta com o Zod e avisa o Frontend instantaneamente.
- **Graceful Degradation (Degradação Graciosa):** O sistema aceita perder capacidade (IA real offline), mas se recusa a falhar completamente, recorrendo ao Mock.
- **Clean Code & Separation of Concerns:** As lógicas não estão misturadas num arquivo gigante de macarrão (spaghetti code). O frontend não sabe nada de IA, ele só envia e exibe. O Backend tem pastas para rotas, schemas e lógica.
- **Type Safety End-to-End:** Redução drástica de bugs na tela de "undefined is not a function" porque garantimos o formato dos dados via TypeScript (schemas.ts).
- **Security:** Proteção da chave de API (`.dev.vars`) no arquivo `.gitignore` logo no início, evitando vazamento de credenciais na nuvem.

---

## 6. Próximos Passos Futuros (Evolução)

Para deixar este software pronto para monetização, as próximas etapas arquiteturais seriam:

1. **Banco de Dados (D1/PostgreSQL):** Utilizar o Cloudflare D1 (Banco SQL na Edge) juntamente com o ORM **Drizzle** para salvar o histórico de requisições de cada usuário.
2. **Autenticação:** Adicionar Login com GitHub/Google usando Clerk ou Lucia Auth.
3. **Limitação de Taxa (Rate Limiting):** Para evitar que um bot envie 10 mil requisições e acabe com sua cota do Gemini, implementaremos um Rate Limit no Hono (ex: máximo de 5 análises por IP por minuto).
