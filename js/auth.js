// =====================================================
// PASSO SEGURO - MÓDULO DE AUTENTICAÇÃO E CADASTRO
// =====================================================

function getSupabase() {
    return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || window.supabase;
}

document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = document.getElementById("form-cadastro");
    if (formCadastro) {
        formCadastro.addEventListener("submit", lidarComCadastro);
    }

    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", lidarComLogin);
    }
});

// -----------------------------------------------------
// FUNÇÃO DE CADASTRO
// -----------------------------------------------------
async function lidarComCadastro(event) {
    event.preventDefault();

    const supabase = getSupabase();
    if (!supabase) {
        mostrarMensagemErro("Erro: Cliente Supabase não inicializado.", "erro");
        return;
    }

    // Captura dos campos do formulário
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;
    const dataNascimento = document.getElementById("data-nascimento").value || null;
    const cartaoSus = document.getElementById("cartao-sus").value.trim() || null;
    
    // Radios
    const historicoUlcera = document.querySelector('input[name="historico_ulcera"]:checked')?.value || "sim";
    const dataCicatrizacao = document.getElementById("data-cicatrizacao").value || null;
    const amputacao = document.querySelector('input[name="amputacao"]:checked')?.value || "nao";
    const aceite = document.getElementById("aceite").checked;

    // Validações básicas
    if (!nome || !email || !senha) {
        mostrarMensagemErro("Preencha todos os campos obrigatórios de acesso.", "erro");
        return;
    }

    if (senha.length < 6) {
        mostrarMensagemErro("A senha precisa ter pelo menos 6 caracteres.", "erro");
        return;
    }

    if (senha !== confirmarSenha) {
        mostrarMensagemErro("As senhas não coincidem.", "erro");
        return;
    }

    if (!aceite) {
        mostrarMensagemErro("Você precisa aceitar os termos de apoio ao autocuidado.", "erro");
        return;
    }

    try {
        mostrarMensagemErro("Criando conta...", "sucesso");

        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: senha
        });

        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error("ID de usuário não retornado.");

        // 2. Inserir dados complementares na tabela perfis_usuarios
        const { error: perfilError } = await supabase
            .from("perfis_usuarios")
            .insert([
                {
                    id: userId,
                    nome_completo: nome,
                    data_nascimento: dataNascimento,
                    cartao_sus: cartaoSus,
                    possui_diabetes: "sim",
                    historico_ulcera: historicoUlcera,
                    data_cicatrizacao: dataCicatrizacao,
                    historico_amputacao: amputacao
                }
            ]);

        if (perfilError) throw perfilError;

        mostrarMensagemErro("Conta criada com sucesso! Redirecionando...", "sucesso");
        
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } catch (error) {
        console.error("Erro no cadastro:", error);
        mostrarMensagemErro("Erro ao cadastrar: " + (error.message || error), "erro");
    }
}

// -----------------------------------------------------
// FUNÇÃO DE LOGIN
// -----------------------------------------------------
async function lidarComLogin(event) {
    event.preventDefault();

    const supabase = getSupabase();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });

        if (error) throw error;

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Erro no login:", error);
        mostrarMensagemErro("E-mail ou senha incorretos.", "erro");
    }
}

// Helper de mensagens na tela
function mostrarMensagem(texto, tipo) {
    const div = document.getElementById("mensagem");
    if (!div) {
        alert(texto);
        return;
    }
    div.textContent = texto;
    div.className = tipo === "sucesso" ? "notificacao notificacao-sucesso" : "notificacao notificacao-erro";
    div.style.display = "block";
}
// Alias para compatibilidade
const mostrarMensagemErro = mostrarMensagem;
