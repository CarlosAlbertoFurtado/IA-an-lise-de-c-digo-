# CodeLens AI - Analisador de Código Serverless

Esse é um projeto que desenvolvi para fazer review de código de forma automática usando a API do Google Gemini. A ideia principal aqui foi construir algo leve, rápido e que rodasse direto na "borda" (Edge computing), então não tem nenhum servidor NodeJS tradicional ligado 24h por trás.

## Estrutura do projeto

Basicamente o repositório está dividido em duas partes:

- `codelens/`: O frontend. Resolvi fazer em **SvelteKit** com Tailwind CSS. Escolhi o SvelteKit porque ele é muito leve e deixa a interface super responsiva.
- `codelens-api/`: O backend. É uma API construída com o framework **Hono** e que roda dentro do **Cloudflare Workers**. A API recebe o código, valida estritamente os tipos usando o **Zod** (pra evitar que a aplicação quebre com dados inesperados) e repassa para o Gemini analisar e devolver o feedback.

Foi um desafio legal pra colocar em prática conceitos de *Type Safety* de ponta a ponta e arquitetura *Serverless*. Fique à vontade pra dar uma olhada no código!
