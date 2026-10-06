# 📖 Documentação Técnica: CodeLens AI

Escrevi este documento para registrar as escolhas de arquitetura que fiz durante o desenvolvimento do CodeLens AI. Minha ideia principal era construir uma aplicação Serverless na "Edge", pensando em baixa latência e em não ter dor de cabeça com infraestrutura.

## 1. Por que separei Frontend e Backend?

Eu quis deixar as responsabilidades bem divididas:
- **Frontend:** Fica só com a interface e experiência do usuário. 
- **Backend (API):** Cuida da regra de negócio, valida os dados e conversa com a API do Google Gemini.

Deixando os dois separados, eu posso hospedar o front em uma CDN qualquer e o back no Cloudflare Workers, rodando em datacenters globais. Isso faz a latência ficar quase zero, porque o código executa na região mais próxima do usuário.

## 2. Minha Stack Tecnológica

Escolhi as ferramentas com base em performance e segurança de tipagem:

### Frontend
- **SvelteKit (Svelte 5):** Decidi usar SvelteKit porque ele não usa Virtual DOM. Ele compila o código direto pra JavaScript puro, o que deixa o pacote bem menor e mais rápido.
- **Tailwind CSS:** Pra estilizar tudo rápido sem criar arquivos CSS gigantes.

### Backend
- **Cloudflare Workers:** Executa o código Serverless. Não tem um servidor rodando 24/7 gastando dinheiro à toa.
- **Hono:** Usei como framework pra rotas. Ele é tipo um Express, só que feito para rodar na Edge, bem levinho.
- **Zod:** Esse aqui foi fundamental. Uso o Zod pra validar os dados que chegam na API. Se vier lixo, o Zod barra na porta antes mesmo de bater na IA.
- **TypeScript:** Usei de ponta a ponta. Ajuda muito a manter a consistência de dados entre o front e o back.
- **Google Gemini API:** Para fazer a análise do código.

## 3. Como funciona o fluxo?

Quando alguém manda um código pra análise, o fluxo acontece em poucos milissegundos:

1. O SvelteKit trava o botão pra evitar duplo clique.
2. Fazemos um `POST` com o código em JSON pra `/api/reviews`.
3. O Hono pega a requisição e joga no Zod (`ReviewRequestSchema.safeParse`). Se vier código vazio, morre aqui retornando `400 Bad Request`.
4. Tudo certo? O backend chama o Gemini pedindo a análise do código.
5. Se a API do Google demorar ou cair, coloquei um *Graceful Degradation* (um fallback no bloco `catch`) que devolve uma análise local simples em Regex. Assim, a tela nunca quebra.
6. A API retorna o JSON pro frontend e o Svelte atualiza só a parte da tela que mudou.

## 4. Próximos passos que pretendo implementar

O projeto já funciona bem, mas se eu fosse colocar pra produção pra milhares de usuários, os próximos passos seriam:

1. **Banco de Dados:** Usar Cloudflare D1 com Drizzle ORM pra salvar o histórico de requisições de cada pessoa.
2. **Rate Limiting:** Colocar um limite de requisições no Hono (tipo 5 análises por IP por minuto) pra evitar que um bot acabe com a cota da API.
