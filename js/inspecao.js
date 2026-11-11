// =====================================================
// PASSO SEGURO
// Arquivo: js/inspecao.js
// Módulo: Inspeção guiada dos pés
// Banco: Supabase (Tabelas: inspecoes e alteracoes)
// =====================================================

let usuarioInspecao = null;

// Helper para obter o cliente Supabase padronizado no projeto
function getSupabase() {
    return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || window.supabase;
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarInspecao();
});

async function inicializarInspecao() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            throw new Error("Supabase não inicializado.");
        }

        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
            window.location.href = "login.html";
            return;
        }

        usuarioInspecao = data.user;

        const formulario = document.getElementById("form-inspecao");
        if (formulario) {
            formulario.addEventListener("submit", registrarInspecao);
        }

        await carregarHistoricoInspecao();

    } catch (erro) {
        console.error("Erro na inspeção:", erro);
        mostrarMensagemInspecao("Não foi possível iniciar a inspeção.");
    }
}

// -----------------------------------------------------
// 2. REGISTRAR INSPEÇÃO (Salvando nas tabelas relacionais)
// -----------------------------------------------------

async function registrarInspecao(event) {
    event.preventDefault();

    try {
        const supabase = getSupabase();
        if (!usuarioInspecao) {
            throw new Error("Usuário não autenticado.");
        }

        const pe = document.getElementById("pe-observado").value; // "direito", "esquerdo", "ambos"
        const regiao = document.getElementById("regiao-pe").value; // "planta", "calcanhar", etc.
        const observacoes = document.getElementById("observacoes-inspecao")?.value || "";

        const checkboxesAlteracoes = document.querySelectorAll('input[name="alteracao"]:checked');
        const alteracoesValues = Array.from(checkboxesAlteracoes).map(campo => campo.value);

        if (!pe || !regiao) {
            mostrarMensagemInspecao("Preencha os campos obrigatórios.");
            return;
        }

        // Mapeamento para as colunas booleanas da tabela 'inspecoes'
        const peDireitoInspecionado = (pe === "direito" || pe === "ambos");
        const peEsquerdoInspecionado = (pe === "esquerdo" || pe === "ambos");
        const identificouAlteracao = alteracoesValues.length > 0;

        // 1. Insere o registro principal na tabela 'inspecoes'
        const { data: inspecaoCriada, error: inspecaoError } = await supabase
            .from("inspecoes")
            .insert([
                {
                    paciente_id: usuarioInspecao.id,
                    pe_direito_inspecionado: peDireitoInspecionado,
                    pe_esquerdo_inspecionado: peEsquerdoInspecionado,
                    identificou_alteracao: identificouAlteracao,
                    observacoes: observacoes
                }
            ])
            .select()
            .single();

        if (inspecaoError) throw inspecaoError;

        const inspecaoId = inspecaoCriada.id;

        // 2. Se houver alterações selecionadas, grava na tabela filha 'alteracoes'
        if (identificouAlteracao && inspecaoId) {
            const registrosAlteracoes = alteracoesValues.map(tipo => ({
                inspecao_id: inspecaoId,
                tipo_alteracao: tipo,
                regiao: regiao
            }));

            const { error: alteracoesError } = await supabase
                .from("alteracoes")
                .insert(registrosAlteracoes);

            if (alteracoesError) throw alteracoesError;
        }

        mostrarMensagemInspecao("Inspeção registrada com sucesso!");

        document.getElementById("form-inspecao").reset();

        await carregarHistoricoInspecao();

    } catch (erro) {
        console.error("Erro ao registrar:", erro);
        mostrarMensagemInspecao("Erro ao salvar inspeção: " + erro.message);
    }
}

// -----------------------------------------------------
// 3. CARREGAR HISTÓRICO (Consumindo a VIEW historico_inspecoes)
// -----------------------------------------------------

async function carregarHistoricoInspecao() {
    const container = document.getElementById("container-historico-inspecoes") || document.getElementById("lista-historico");

    if (!container || !usuarioInspecao) return;

    container.textContent = "Carregando histórico...";

    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from("historico_inspecoes")
            .select("*")
            .eq("paciente_id", usuarioInspecao.id)
            .order("data_inspecao", { ascending: false })
            .limit(30);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.textContent = "Nenhuma inspeção registrada até o momento.";
            return;
        }

        const lista = document.createElement("div");

        data.forEach(registro => {
            const card = document.createElement("div");
            card.style.cssText = "padding:14px;margin-bottom:12px;border:1px solid #dbe3ea;border-radius:8px;background:#fff;";

            const dataRegistro = new Date(registro.data_inspecao || registro.created_at).toLocaleString("pt-BR");

            const titulo = document.createElement("strong");
            titulo.textContent = "Data: " + dataRegistro;

            const pes = [];
            if (registro.pe_direito_inspecionado) pes.push("Pé Direito");
            if (registro.pe_esquerdo_inspecionado) pes.push("Pé Esquerdo");

            const pe = document.createElement("p");
            pe.style.margin = "6px 0 4px";
            pe.textContent = "Pés inspecionados: " + (pes.join(" e ") || "Não especificado");

            const alteracoes = document.createElement("p");
            alteracoes.style.margin = "0";
            alteracoes.textContent = "Total de alterações encontradas: " + (registro.total_alteracoes || 0);

            card.append(titulo, pe, alteracoes);
            lista.appendChild(card);
        });

        container.replaceChildren(lista);

    } catch (erro) {
        console.error("Erro no histórico:", erro);
        container.textContent = "Não foi possível carregar o histórico.";
    }
}

// -----------------------------------------------------
// 4. MENSAGENS
// -----------------------------------------------------

function mostrarMensagemInspecao(mensagem) {
    const elemento = document.getElementById("mensagem-inspecao");

    if (elemento) {
        elemento.textContent = mensagem;
        elemento.style.display = "block";
    } else {
        alert(mensagem);
    }
}

// -----------------------------------------------------
// 5. FUNÇÕES GLOBAIS
// -----------------------------------------------------

window.registrarInspecao = registrarInspecao;
window.carregarHistoricoInspecao = carregarHistoricoInspecao;
