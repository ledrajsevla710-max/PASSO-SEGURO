// =====================================================
// PASSO SEGURO
// Arquivo: js/inspecao.js
// Registro de Inspeções e Alterações dos Pés
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    const formInspecao = document.getElementById("form-inspecao");
    if (formInspecao) {
        formInspecao.addEventListener("submit", registrarInspecao);
    }
});

// Helper para obter o cliente Supabase
function getSupabase() {
    return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || null;
}

// -----------------------------------------------------
// FUNÇÃO PRINCIPAL DE REGISTRO DE INSPEÇÃO
// -----------------------------------------------------
async function registrarInspecao(event) {
    event.preventDefault();

    const supabase = getSupabase();
    if (!supabase) {
        mostrarMensagemInspecao("Erro de conexão com o sistema.", "erro");
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

        // 2. GARANTIR que o perfil existe (resolve o erro de foreign key)
        await garantirPerfilExiste(supabase, pacienteId, session.user);

        // 3. Capturar valores do formulário
        const peObservado = document.getElementById("pe-observado")?.value;
        const regiaoBase = document.getElementById("regiao-pe")?.value;
        const observacoes = document.getElementById("observacoes-inspecao")?.value.trim() || null;

        const checkboxesMarcados = document.querySelectorAll('input[name="alteracao"]:checked');
        const alteracoesSelecionadas = Array.from(checkboxesMarcados).map(cb => cb.value);

        const identificouAlteracao = alteracoesSelecionadas.length > 0;

        const peDireitoInspecionado = (peObservado === "direito" || peObservado === "ambos");
        const peEsquerdoInspecionado = (peObservado === "esquerdo" || peObservado === "ambos");

        mostrarMensagemInspecao("Registrando inspeção...", "sucesso");

        // 4. Inserir o registro principal na tabela `inspecoes`
        const { data: inspecaoData, error: inspecaoError } = await supabase
            .from("inspecoes")
            .insert([{
                paciente_id: pacienteId,
                pe_direito_inspecionado: peDireitoInspecionado,
                pe_esquerdo_inspecionado: peEsquerdoInspecionado,
                identificou_alteracao: identificouAlteracao,
                observacoes: observacoes
            }])
            .select()
            .single();

        if (inspecaoError) throw inspecaoError;

        const inspecaoId = inspecaoData.id;

        // 5. Se houver alterações, inserir na tabela `alteracoes`
        if (identificouAlteracao && inspecaoId) {
            let sufixoPes = [];
            if (peObservado === "direito") sufixoPes = ["_direito"];
            else if (peObservado === "esquerdo") sufixoPes = ["_esquerdo"];
            else sufixoPes = ["_direito", "_esquerdo"];

            const listaAlteracoesParaInserir = [];

            alteracoesSelecionadas.forEach(altLabel => {
                const tipoAlteracao = normalizarTipoAlteracao(altLabel);

                sufixoPes.forEach(sufixo => {
                    const localPe = regiaoBase + sufixo;

                    listaAlteracoesParaInserir.push({
                        inspecao_id: inspecaoId,
                        tipo_alteracao: tipoAlteracao,
                        local_pe: localPe,
                        descricao: observacoes
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

        // Limpar formulário
        document.getElementById("form-inspecao")?.reset();

        // Atualiza o histórico se a função existir
        if (typeof carregarHistorico === "function") {
            setTimeout(() => carregarHistorico(), 800);
        }

    } catch (error) {
        console.error("Erro ao registrar inspeção:", error);
        mostrarMensagemInspecao(
            "Erro ao registrar: " + (error.message || "tente novamente"),
            "erro"
        );
    }
}

// -----------------------------------------------------
// Garante que o perfil existe na tabela perfis_usuarios
// -----------------------------------------------------
async function garantirPerfilExiste(supabase, userId, user) {
    try {
        // Verifica se já existe
        const { data, error } = await supabase
            .from("perfis_usuarios")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

        if (error) throw error;

        // Se já existe, não faz nada
        if (data) return;

        // Não existe → cria um registro básico
        console.warn("Perfil não encontrado. Criando perfil básico...");

        const nome = localStorage.getItem("usuario_nome") 
            || user.user_metadata?.nome_completo 
            || "Paciente";

        const { error: insertError } = await supabase
            .from("perfis_usuarios")
            .insert([{
                id: userId,
                nome_completo: nome,
                possui_diabetes: "sim"
            }]);

        if (insertError) {
            console.error("Erro ao criar perfil básico:", insertError);
            throw new Error("Não foi possível criar o perfil do paciente. Tente fazer o cadastro novamente.");
        }

        console.log("Perfil básico criado com sucesso.");

    } catch (error) {
        console.error("Erro em garantirPerfilExiste:", error);
        throw error;
    }
}

// -----------------------------------------------------
// Normaliza o tipo de alteração
// -----------------------------------------------------
function normalizarTipoAlteracao(label) {
    const mapa = {
        "vermelhidão": "vermelhidao",
        "vermelhidao": "vermelhidao",
        "inchaço": "inchaco",
        "inchaco": "inchaco",
        "calor": "calor",
        "bolha": "bolha",
        "calo": "calo",
        "ferimento": "ferimento",
        "secreção": "secrecao",
        "secrecao": "secrecao",
        "dor": "dor",
        "outro": "outro"
    };

    const chave = (label || "").toLowerCase().trim();
    return mapa[chave] || "outro";
}

// -----------------------------------------------------
// Mensagens na tela de inspeção
// -----------------------------------------------------
function mostrarMensagemInspecao(mensagem, tipo) {
    // Tenta vários IDs comuns de mensagem
    const elemento = document.getElementById("mensagem-inspecao") 
        || document.getElementById("mensagem")
        || document.querySelector(".notificacao");

    if (elemento) {
        elemento.textContent = mensagem;
        elemento.style.display = "block";
        elemento.className = tipo === "sucesso"
            ? "notificacao notificacao-sucesso"
            : "notificacao notificacao-erro";
        return;
    }

    alert(mensagem);
}
