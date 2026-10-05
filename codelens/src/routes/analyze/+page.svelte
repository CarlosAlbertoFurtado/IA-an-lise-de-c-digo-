<script lang="ts">
	// --- ESTADO DA PÁGINA ---
	// No Svelte, usamos "$state" para criar variáveis reativas.
	// "Reativa" significa: quando o valor muda, a tela atualiza sozinha.

	let codeInput: string = $state('');        // O código que o usuário digitar
	let language: string = $state('javascript'); // A linguagem selecionada
	let isLoading: boolean = $state(false);     // Está carregando? (true/false)
	let result: any = $state(null);             // O resultado da análise da IA
	let errorMsg: string = $state('');          // Mensagem de erro, se houver

	// --- ENDEREÇO DA NOSSA API ---
	// O backend Hono roda na porta 8787
	const API_URL = 'http://localhost:8787';

	// --- FUNÇÃO DE ANÁLISE (AGORA CONECTADA AO BACKEND!) ---
	async function analyzeCode() {
		if (!codeInput.trim()) return;

		isLoading = true;
		result = null;
		errorMsg = '';

		try {
			// --- CHAMADA REAL À API ---
			// fetch() = "vá até esse endereço e mande/pegue dados"
			// method: 'POST' = "estou ENVIANDO dados" (não apenas pedindo)
			// headers = "o pacote que eu mando é do tipo JSON"
			// body = o pacote em si (código + linguagem), convertido para texto JSON
			const response = await fetch(`${API_URL}/api/reviews`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: codeInput,
					language: language
				})
			});

			// --- LENDO A RESPOSTA ---
			const data = await response.json();

			// Se a API retornou erro (ex: Zod barrou os dados)
			if (!response.ok) {
				errorMsg = data.error || 'Erro desconhecido na API';
				return;
			}

			// Sucesso! Guardamos o resultado
			result = data.data;

		} catch (err) {
			// Se o fetch falhou completamente (ex: API fora do ar)
			errorMsg = 'Não foi possível conectar à API. Verifique se o backend está rodando.';
		} finally {
			// "finally" roda SEMPRE, deu certo ou não
			isLoading = false;
		}
	}
</script>

<main class="min-h-screen bg-slate-950 text-white p-6 font-sans">
	
	<!-- Cabeçalho da Página -->
	<header class="max-w-5xl mx-auto pt-8 pb-12">
		<a href="/" class="text-slate-400 hover:text-white transition-colors duration-200 no-underline text-sm">
			← Voltar ao Início
		</a>
		<h1 class="text-3xl md:text-4xl font-bold mt-6">
			Análise de Código
		</h1>
		<p class="text-slate-400 mt-2">
			Cole seu código abaixo e deixe a IA fazer o Code Review por você.
		</p>
	</header>

	<!-- Área Principal: Formulário + Resultado -->
	<div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

		<!-- COLUNA ESQUERDA: Entrada de Código -->
		<div class="space-y-4">
			<!-- Seletor de Linguagem -->
			<div class="flex items-center gap-3">
				<label for="language-select" class="text-sm text-slate-400 font-medium">Linguagem:</label>
				<select
					id="language-select"
					bind:value={language}
					class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
				>
					<option value="javascript">JavaScript</option>
					<option value="typescript">TypeScript</option>
					<option value="python">Python</option>
					<option value="java">Java</option>
				</select>
			</div>

			<!-- Campo de Texto para o Código -->
			<textarea
				bind:value={codeInput}
				placeholder="// Cole seu código aqui..."
				rows="18"
				class="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-green-400 font-mono text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-600"
			></textarea>

			<!-- Botão de Analisar -->
			<button
				onclick={analyzeCode}
				disabled={!codeInput.trim() || isLoading}
				class="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)]"
			>
				{#if isLoading}
					⏳ Analisando...
				{:else}
					🔍 Analisar Código
				{/if}
			</button>

			<!-- Mensagem de Erro (Zod ou Rede) -->
			{#if errorMsg}
				<div class="bg-red-950/50 border border-red-900 rounded-lg p-4 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
					⚠️ {errorMsg}
				</div>
			{/if}
		</div>

		<!-- COLUNA DIREITA: Resultado da Análise -->
		<div class="space-y-6">
			{#if isLoading}
				<!-- Estado: Carregando -->
				<div class="flex items-center justify-center h-full">
					<div class="text-center space-y-4">
						<div class="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
						<p class="text-slate-400">A IA está revisando seu código...</p>
					</div>
				</div>

			{:else if result}
				<!-- Estado: Resultado Pronto -->

				<!-- Card da Nota -->
				<div class="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
					<p class="text-sm text-slate-400 mb-2">Nota Geral</p>
					<p class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
						{result.score}
					</p>
					<p class="text-slate-500 text-sm mt-1">de 10.0</p>
				</div>

				<!-- Card de Vulnerabilidades -->
				<div class="bg-slate-900 border border-red-900/50 rounded-xl p-6">
					<h3 class="text-red-400 font-semibold mb-4 flex items-center gap-2">
						⚠️ Vulnerabilidades ({result.vulnerabilities.length})
					</h3>
					<ul class="space-y-3">
						{#each result.vulnerabilities as vuln}
							<li class="text-sm text-slate-300 bg-red-950/30 border border-red-900/30 rounded-lg p-3">
								{vuln}
							</li>
						{/each}
					</ul>
				</div>

				<!-- Card de Sugestões -->
				<div class="bg-slate-900 border border-green-900/50 rounded-xl p-6">
					<h3 class="text-green-400 font-semibold mb-4 flex items-center gap-2">
						💡 Sugestões de Melhoria ({result.suggestions.length})
					</h3>
					<ul class="space-y-3">
						{#each result.suggestions as sug}
							<li class="text-sm text-slate-300 bg-green-950/30 border border-green-900/30 rounded-lg p-3">
								{sug}
							</li>
						{/each}
					</ul>
				</div>

			{:else}
				<!-- Estado: Vazio (esperando o usuário) -->
				<div class="flex items-center justify-center h-full">
					<div class="text-center space-y-3 text-slate-600">
						<p class="text-6xl">🔬</p>
						<p class="text-lg font-medium">Aguardando seu código</p>
						<p class="text-sm">Cole o código à esquerda e clique em "Analisar"</p>
					</div>
				</div>
			{/if}
		</div>

	</div>
</main>
