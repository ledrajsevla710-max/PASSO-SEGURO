// js/app.js
// Lógica do Painel (Dashboard) e Proteção de Sessão com Supabase

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar se o usuário está autenticado de forma segura pelo Supabase
    if (typeof supabaseClient !== 'undefined') {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error || !session) {
            // Se não houver sessão ativa, redireciona para o login
            alert("Sessão expirada ou acesso não autorizado. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        // Se houver sessão, podemos buscar os dados do perfil na tabela 'profiles'
        const user = session.user;
        carregarPerfilUsuario(user.id);
    } else {
        console.error("Cliente Supabase não inicializado.");
    }

    // 2. Configurar o botão de Sair (Logout) seguro
    const btnSair = document.getElementById("btn-sair") || document.getElementById("logout-btn");
    if (btnSair) {
        btnSair.addEventListener("click", async (e) => {
            e.preventDefault();
            if (typeof supabaseClient !== 'undefined') {
                await supabaseClient.auth.signOut();
            }
            // Limpa apenas o necessário e redireciona
            window.location.href = "login.html";
        });
    }

    // 3. Configurar formulário de Inspeção dos Pés (se presente na página)
    const formInspecao = document.getElementById("form-inspecao");
    if (formInspecao) {
        formInspecao.addEventListener("submit", async (e) => {
            e.preventDefault();
            await salvarInspecaoPes();
        });
    }
});

// Função para carregar o nome e dados do perfil com segurança
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
                // Uso de textContent para evitar vulnerabilidades de XSS
                elementoNome.textContent = data.nome_completo;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar perfil:", error.message);
    }
}

// Função para registrar a inspeção dos pés no banco de dados
async function salvarInspecaoPes() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const peObservado = document.getElementById("pe-observado") ? document.getElementById("pe-observado").value : "direito";
        const regiao = document.getElementById("regiao-observada") ? document.getElementById("regiao-observada").value : "planta";
        const procurouAtendimento = document.getElementById("procurou-atendimento") ? document.getElementById("procurou-atendimento").checked : false;

        const { error } = await supabaseClient
            .from('inspecoes_pes')
            .insert([
                {
                    paciente_id: session.user.id,
                    realizado_por: 'proprio_paciente',
                    pe_observado: peObservado,
                    regiao: regiao,
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
