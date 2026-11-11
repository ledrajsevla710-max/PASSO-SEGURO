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
// 1. INICIALIZAÇÃO
// -----------------------------------------------------
async function inicializarPerfil() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            console.error("Supabase não encontrado. Verifique se o config.js foi carregado.");
            return;
        }

        const { data: sessaoData, error: sessaoError } = await supabase.auth.getSession();

        if (sessaoError) {
            console.error("Erro ao obter sessão:", sessaoError);
            window.location.href = "login.html";
            return;
        }

        const sessao = sessaoData?.session;

        if (!sessao) {
            // Não está logado → volta para o login
            window.location.href = "login.html";
            return;
        }

        usuarioPerfil = sessao.user;

        // Carrega os dados do perfil
        await carregarPerfil();

        // Liga o formulário de edição (se existir na página)
        const formulario = document.getElementById("form-perfil");
        if (formulario) {
            formulario.addEventListener("submit", salvarPerfil);
        }

    } catch (error) {
        console.error("Erro ao inicializar perfil:", error);
        mostrarMensagem("Não foi possível carregar seu perfil.", "erro");
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
            // Se o perfil ainda não existir, tenta criar um básico
            if (error.code === "PGRST116") {
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

        // Atualiza o nome no localStorage (útil para o dashboard)
        if (data.nome_completo) {
            localStorage.setItem("usuario_nome", data.nome_completo);
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

        const nomeFallback = localStorage.getItem("usuario_nome") || usuarioPerfil.user_metadata?.nome_completo || "Usuário";

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
// -----------------------------------------------------
function preencherFormulario(perfil) {
    preencherCampo("perfil-nome", perfil.nome_completo || perfil.nome || "");
    preencherCampo("perfil-email", usuarioPerfil?.email || perfil.email || "");
    preencherCampo("perfil-cartao-sus", perfil.cartao_sus || "");
}

// -----------------------------------------------------
// 5. FUNÇÃO AUXILIAR PARA PREENCHER CAMPOS
// -----------------------------------------------------
function preencherCampo(id, valor) {
    const campo = document.getElementById(id);
    if (campo) {
        campo.value = valor ?? "";
    }
}

// -----------------------------------------------------
// 6. SALVAR ALTERAÇÕES DO PERFIL
// -----------------------------------------------------
async function salvarPerfil(event) {
    event.preventDefault();

    try {
        if (!usuarioPerfil) {
            mostrarMensagem("Usuário não autenticado. Faça login novamente.", "erro");
            return;
        }

        const nome = obterValor("perfil-nome");
        const cartaoSus = obterValor("perfil-cartao-sus");

        if (!nome) {
            mostrarMensagem("Informe seu nome completo.", "erro");
            return;
        }

        const dadosAtualizados = {
            nome_completo: nome,
            cartao_sus: cartaoSus || null
        };

        const supabase = getSupabase();
        const { error } = await supabase
            .from("perfis_usuarios")
            .update(dadosAtualizados)
            .eq("id", usuarioPerfil.id);

        if (error) throw error;

        // Atualiza localStorage
        localStorage.setItem("usuario_nome", nome);

        mostrarMensagem("Perfil atualizado com sucesso!", "sucesso");

        // Recarrega os dados
        await carregarPerfil();

    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        mostrarMensagem("Erro ao salvar os dados: " + (error.message || "tente novamente"), "erro");
    }
}

// -----------------------------------------------------
// 7. OBTER VALOR DOS CAMPOS
// -----------------------------------------------------
function obterValor(id) {
    const campo = document.getElementById(id);
    return campo ? campo.value.trim() : "";
}

// -----------------------------------------------------
// 8. MENSAGENS AO USUÁRIO
// -----------------------------------------------------
function mostrarMensagem(mensagem, tipo) {
    const elemento = document.getElementById("mensagem-perfil") || document.getElementById("mensagem");

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

// -----------------------------------------------------
// 9. DISPONIBILIZAR FUNÇÕES GLOBALMENTE
// -----------------------------------------------------
window.carregarPerfil = carregarPerfil;
window.salvarPerfil = salvarPerfil;
