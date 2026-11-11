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

// Helper para obter o cliente Supabase configurado
function getSupabase() {
    return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || window.supabase;
}

// -----------------------------------------------------
// 1. INICIALIZAÇÃO
// -----------------------------------------------------

async function inicializarPerfil() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            throw new Error("Conexão com o Supabase não encontrada.");
        }

        const { data: sessaoData, error: sessaoError } =
            await supabase.auth.getSession();

        if (sessaoError) throw sessaoError;

        const sessao = sessaoData.session;

        if (!sessao) {
            window.location.href = "login.html";
            return;
        }

        usuarioPerfil = sessao.user;

        await carregarPerfil();

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
        const { data, error } = await supabase
            .from("perfis_usuarios")
            .select("*")
            .eq("id", usuarioPerfil.id)
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error("Perfil do paciente não encontrado.");
        }

        dadosPerfil = data;

        preencherFormulario(data);

    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        mostrarMensagem(
            "Não foi possível consultar os dados cadastrados.",
            "erro"
        );
    }
}

// -----------------------------------------------------
// 3. PREENCHER FORMULÁRIO
// -----------------------------------------------------

function preencherFormulario(perfil) {

    preencherCampo("perfil-nome",
        perfil.nome_completo || perfil.nome || ""
    );

    preencherCampo("perfil-email",
        perfil.email || usuarioPerfil.email || ""
    );

    preencherCampo("perfil-cartao-sus",
        perfil.cartao_sus || ""
    );

    preencherCampo("perfil-status-clinico",
        perfil.status_clinico || "remissao"
    );

}

// -----------------------------------------------------
// 4. FUNÇÃO AUXILIAR PARA PREENCHER CAMPOS
// -----------------------------------------------------

function preencherCampo(id, valor) {
    const campo = document.getElementById(id);

    if (campo) {
        campo.value = valor ?? "";
    }
}

// -----------------------------------------------------
// 5. SALVAR ALTERAÇÕES DO PERFIL
// -----------------------------------------------------

async function salvarPerfil(event) {
    event.preventDefault();

    try {
        if (!usuarioPerfil) {
            throw new Error("Usuário não autenticado.");
        }

        const nome = obterValor("perfil-nome");
        const cartaoSus = obterValor("perfil-cartao-sus");
        const statusClinico = obterValor("perfil-status-clinico");

        // Validação dos campos
        if (!nome) {
            mostrarMensagem("Informe seu nome completo.", "erro");
            return;
        }

        if (!statusClinico) {
            mostrarMensagem("Selecione sua situação clínica.", "erro");
            return;
        }

        const dadosAtualizados = {
            nome_completo: nome,
            cartao_sus: cartaoSus || null,
            status_clinico: statusClinico
        };

        const supabase = getSupabase();
        const { error } = await supabase
            .from("perfis_usuarios")
            .update(dadosAtualizados)
            .eq("id", usuarioPerfil.id);

        if (error) throw error;

        *Verification:* O painel exibe a notificação verde de sucesso informando que os dados foram salvos.

        mostrarMensagem(
            "Perfil atualizado com sucesso!",
            "sucesso"
        );

        await carregarPerfil();

    } catch (error) {
        console.error("Erro ao salvar perfil:", error);

        mostrarMensagem(
            "Erro ao salvar os dados: " + error.message,
            "erro"
        );
    }
}

// -----------------------------------------------------
// 6. OBTER VALOR DOS CAMPOS
// -----------------------------------------------------

function obterValor(id) {
    const campo = document.getElementById(id);

    return campo ? campo.value.trim() : "";
}

// -----------------------------------------------------
// 7. MENSAGENS AO USUÁRIO
// -----------------------------------------------------

function mostrarMensagem(mensagem, tipo) {

    const elemento = document.getElementById("mensagem-perfil");

    if (elemento) {
        elemento.textContent = mensagem;

        elemento.style.display = "block";

        elemento.style.color =
            tipo === "sucesso" ? "#137333" : "#b42318";

        return;
    }

    alert(mensagem);
}

// -----------------------------------------------------
// 8. DISPONIBILIZAR FUNÇÕES GLOBALMENTE
// -----------------------------------------------------

window.carregarPerfil = carregarPerfil;
window.salvarPerfil = salvarPerfil;
