// =====================================================
// PASSO SEGURO
// Arquivo: js/perfil.js
// Gerenciamento do perfil do paciente
// Integração: Supabase
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarPerfil();
});

// Usuário atualmente autenticado
let usuarioPerfil = null;
let dadosPerfil = null;

// Helper para obter o cliente Supabase
function getSupabase() {
    return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || null;
}

// -----------------------------------------------------
// 1. INICIALIZAÇÃO (com proteção contra loop)
// -----------------------------------------------------
async function inicializarPerfil() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            console.error("Supabase não encontrado.");
            return;
        }

        // Tenta pegar a sessão com um pequeno atraso de segurança
        let sessao = null;
        let tentativas = 0;

        while (tentativas < 5) {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Erro ao obter sessão:", error);
                break;
            }

            if (data?.session) {
                sessao = data.session;
                break;
            }

            // Espera 300ms e tenta de novo (ajuda a evitar o loop)
            await new Promise(resolve => setTimeout(resolve, 300));
            tentativas++;
        }

        if (!sessao) {
            console.warn("Nenhuma sessão encontrada após tentativas. Redirecionando para login...");
            window.location.href = "login.html";
            return;
        }

        // Sessão encontrada
        usuarioPerfil = sessao.user;
        console.log("Usuário autenticado:", usuarioPerfil.email);

        // Carrega o perfil
        await carregarPerfil();

        // Liga o formulário de edição (se existir)
        const formulario = document.getElementById("form-perfil");
        if (formulario) {
            formulario.addEventListener("submit", salvarPerfil);
        }

    } catch (error) {
        console.error("Erro ao inicializar perfil:", error);
    }
}

// -----------------------------------------------------
// 2. CARREGAR PERFIL DO SUPABASE
// -----------------------------------------------------
async function carregarPerfil() {
    try {
        const supabase = getSupabase();
        if (!supabase || !usuarioPerfil) return;

        const { data, error } = await supabase
            .from("perfis_usuarios")
            .select("*")
            .eq("id", usuarioPerfil.id)
            .single();

        if (error) {
            // Se o perfil não existir ainda, cria um básico
            if (error.code === "PGRST116" || error.message?.includes("No rows")) {
                console.warn("Perfil não encontrado. Criando registro básico...");
                await criarPerfilBasico();
                return;
            }
            throw error;
        }

        if (!data) {
            await criarPerfilBasico();
            return;
        }

        dadosPerfil = data;
        preencherFormulario(data);

        // Atualiza o nome na tela e no localStorage
        if (data.nome_completo) {
            localStorage.setItem("usuario_nome", data.nome_completo);

            const nomeDisplay = document.getElementById("nome-paciente-display");
            if (nomeDisplay) {
                nomeDisplay.textContent = data.nome_completo;
            }
        }

    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        mostrarMensagem("Não foi possível consultar os dados cadastrados.", "erro");
    }
}

// -----------------------------------------------------
// 3. CRIAR PERFIL BÁSICO (caso não exista)
// -----------------------------------------------------
async function criarPerfilBasico() {
    try {
        const supabase = getSupabase();
        if (!supabase || !usuarioPerfil) return;

        const nomeFallback = localStorage.getItem("usuario_nome") 
            || usuarioPerfil.user_metadata?.nome_completo 
            || "Paciente";

        const { error } = await supabase
            .from("perfis_usuarios")
            .insert([{
                id: usuarioPerfil.id,
                nome_completo: nomeFallback,
                possui_diabetes: "sim"
            }]);

        if (error) throw error;

        // Recarrega após criar
        await carregarPerfil();

    } catch (error) {
        console.error("Erro ao criar perfil básico:", error);
    }
}

// -----------------------------------------------------
// 4. PREENCHER FORMULÁRIO
// 
