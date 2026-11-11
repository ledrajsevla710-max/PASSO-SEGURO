// =====================================================
// PASSO SEGURO
// Arquivo: js/inspecao.js
// Registro de Inspeções e Alterações dos Pés
// Integração: Supabase (Tabelas: inspecoes e alteracoes)
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    const formInspecao = document.getElementById("form-inspecao");
    if (formInspecao) {
        formInspecao.addEventListener("submit", registrarInspecao);
    }
});

// Helper para obter o cliente Supabase padronizado
function getSupabase() {
    return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || window.supabase;
}

// -----------------------------------------------------
// FUNÇÃO PRINCIPAL DE REGISTRO DE INSPEÇÃO
// -----------------------------------------------------
async function registrarInspecao(event) {
    event.preventDefault();

    const supabase = getSupabase();
    if (!supabase) {
        mostrarMensagemInspecao("Erro de conexão com o Supabase.", "erro");
        return;
    }

    try {
        // 1. Verificar usuário autenticado
        const { data: sessaoData, error: sessaoError } = await supabase.auth.getSession();
        if (sessaoError) throw sessaoError;

        const session = sessaoData.session;
        if (!session) {
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const pacienteId = session.user.id;

        // 2. Capturar valores do formulário
        const peObservado = document.getElementById("pe-observado").value; // "direito", "esquerdo", "ambos"
        const regiaoBase = document.getElementById("regiao-pe").value;     // "planta", "calcanhar", "entre_dedos", "dorso"
        const observacoes = document.getElementById("observacoes-inspecao").value.trim();

        // Capturar checkboxes de alterações marcadas
        const checkboxesMarcados = document.querySelectorAll('input[name="alteracao"]:checked');
        const alteracoesSelecionadas = Array.from(checkboxesMarcados).map(cb => cb.value);

        const identificouAlteracao = alteracoesSelecionadas.length > 0;

        // Definir quais pés foram inspecionados com base na seleção
        const peDireitoInspecionado = (peObservado === "direito" || peObservado === "ambos");
        const peEsquerdoInspecionado = (peObservado === "esquerdo" || peObservado === "ambos");

        mostrarMensagemInspecao("Registrando inspeção...", "sucesso");

        // 3. Inserir o registro principal na tabela `inspecoes`
        const { data: inspecaoData, error: inspecaoError } = await supabase
            .from("inspecoes")
            .insert([
                {
                    paciente_id: pacienteId,
                    pe_direito_inspecionado: peDireitoInspecionado,
                    pe_esquerdo_inspecionado: peEsquerdoInspecionado,
                    identificou_alteracao: identificouAlteracao,
                    observacoes: observacoes || null
                }
            ])
            .select()
            .single();

        if (inspecaoError) throw inspecaoError;

        const inspecaoId = inspecaoData.id;

        // 4. Se houver alterações marcadas, inserir na tabela `alteracoes`
        if (identificouAlteracao && inspecaoId) {
            // Determinar o sufixo do pé com base no campo peObservado
            let sufixoPes = [];
            if (peObservado === "direito") sufixoPes = ["_direito"];
            else if (peObservado === "esquerdo") sufixoPes = ["_esquerdo"];
            else sufixoPes = ["_direito", "_esquerdo"]; // Se ambos, aplica ao lado principal ou ambos conforme escolha

            const listaAlteracoesParaInserir = [];

            alteracoesSelecionadas.forEach(altLabel => {
                // Normalizar o tipo de alteração para bater com a constraint do banco
                let tipoAlteracao = normalizarTipoAlteracao(altLabel);

                sufixoPes.forEach(sufixo => {
                    let localPe = regiaoBase + sufixo; // Ex: "planta_direita"
                    
                    listaAlteracoesParaInserir.push({
                        inspecao_id: inspecaoId,
                        tipo_alteracao: tipoAlteracao,
                        local_pe: localPe,
                        descricao: observacoes || null
                    });
                });
            });

            if (listaAlteracoesParaInserir.length > 0) {
                const { error: altError } = await supabase
                    .from("alteracoes")
                    .insert(listaAlteracoesParaInserir);

                if (altError) throw altError;
            }
        }

        mostrarMensagemInspecao("Inspeção registrada com sucesso!", "sucesso");

        // Limpar formulário após o sucesso
        document.getElementById("form-inspecao").reset();

        // Opcional: Atualizar selects de fotos caso exista a aba de fotos
        if (typeof carregarSelectInspecoes === "function") {
            carregarSelectInspecoes();
        }

    } catch (error) {
        console.error("Erro ao registrar inspeção:", error);
        mostrarMensagemInspecao("Erro ao registrar: " + (error.message || error), "erro");
    }
}

// -----------------------------------------------------
// FUNÇÃO AUXILIAR: NORMALIZAR TIPO DE ALTERAÇÃO
// -----------------------------------------------------
function normalizarTipoAlteracao(label) {
    const texto = label.toLowerCase();
    if (texto.includes("vermelhidão")) return "vermelhidao";
    if (texto.includes("quente") || texto.includes("inchado") || texto.includes("inchaço")) return "inchaço";
    if (texto.includes("calor")) return "calor";
    if (texto.includes("bolha")) return "bolha";
    if (texto.includes("calo")) return "calo";
    if (texto.includes("ferida") || texto.includes("curativo")) return "ferimento";
    if (texto.includes("secreção")) return "secrecao";
    if (texto.includes("dor")) return "dor";
    return "outro";
}

// -----------------------------------------------------
// FUNÇÃO AUXILIAR DE MENSAGENS NA TELA
// -----------------------------------------------------
function mostrarMensagemInspecao(mensagem, tipo) {
    const div = document.getElementById("mensagem-inspecao");
    if (!div) return;

    div.textContent = mensagem;
    div.style.display = "block";
    div.className = tipo === "sucesso" ? "message notificacao-sucesso" : "message notificacao-erro";
}
