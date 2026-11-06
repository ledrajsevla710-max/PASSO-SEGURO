// js/app.js
// Lógica do Painel (Dashboard) e Salvamento de Dados com Supabase

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar se o usuário está autenticado de forma segura pelo Supabase
    if (typeof supabaseClient !== 'undefined') {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error || !session) {
            alert("Sessão expirada ou acesso não autorizado. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const user = session.user;
        carregarPerfilUsuario(user.id);
    } else {
        console.error("Cliente Supabase não inicializado.");
    }

    // 2. Configurar o botão de Sair (Logout) seguro
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", async (e) => {
            e.preventDefault();
            if (typeof supabaseClient !== 'undefined') {
                await supabaseClient.auth.signOut();
            }
            window.location.href = "login.html";
        });
    }

    // 3. Configurar o envio do Histórico de Remissão
    const formHistorico = document.getElementById("form-historico-remissao");
    if (formHistorico) {
        formHistorico.addEventListener("submit", async (e) => {
            e.preventDefault();
            await salvarHistoricoRemissao();
        });
    }

    // 4. Configurar o formulário de Inspeção dos Pés
    const formInspecao = document.getElementById("form-inspecao");
    if (formInspecao) {
        formInspecao.addEventListener("submit", async (e) => {
            e.preventDefault();
            await salvarInspecaoPes();
        });
    }
});

// Função para carregar o nome do perfil com segurança
async function carregarPerfilUsuario(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (data) {
            const elementoNome = document.getElementById("nome-usuario-display");
            if (elementoNome) {
                elementoNome.textContent = data.nome_completo;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar perfil:", error.message);
    }
}

// Função para salvar o Histórico da Úlcera Cicatrizada
async function salvarHistoricoRemissao() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const dataLesao = document.getElementById("data-ultima-lesao").value;
        const localLesao = document.getElementById("local-ultima-lesao").value;
        const amputacaoRadio = document.querySelector('input[name="amputacao"]:checked');
        const antecedenteAmputacao = amputacaoRadio ? amputacaoRadio.value === 'sim' : false;

        const { error } = await supabaseClient
            .from('historico_pacientes')
            .insert([
                {
                    paciente_id: session.user.id,
                    data_ultima_lesao: dataLesao || null,
                    localizacao_ultima_lesao: localLesao,
                    antecedente_amputacao: antecedenteAmputacao
                }
            ]);

        if (error) throw error;

        alert("Histórico de remissão salvo com sucesso!");
    } catch (error) {
        alert("Erro ao salvar histórico: " + error.message);
        console.error("Erro histórico:", error);
    }
}

// Função para registrar a inspeção dos pés no banco de dados
async function salvarInspecaoPes() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const realizadoPor = document.getElementById("realizado-por").value;
        const peObservado = document.getElementById("pe-observado").value;
        const regiao = document.getElementById("regiao-observada").value;
        const procurouAtendimento = document.getElementById("procurou-atendimento").checked;

        // Capturar alterações marcadas nas caixas de seleção
        const alteracoesSelecionadas = [];
        document.querySelectorAll('.chk-alteracao:checked').forEach(checkbox => {
            alteracoesSelecionadas.push(checkbox.value);
        });

        const { error } = await supabaseClient
            .from('inspecoes_pes')
            .insert([
                {
                    paciente_id: session.user.id,
                    realizado_por: realizadoPor,
                    pe_observado: peObservado,
                    regiao: regiao,
                    alteracoes_percebidas: alteracoesSelecionadas,
                    procurou_atendimento: procurouAtendimento
                }
            ]);

        if (error) throw error;

        alert("Inspeção registrada com sucesso!");
        document.getElementById("form-inspecao").reset();
    } catch (error) {
        alert("Erro ao salvar inspeção: " + error.message);
        console.error("Erro inspeção:", error);
    }
}
