// =====================================================
// PASSO SEGURO
// Arquivo: js/auth.js
// Gerenciamento de Autenticação (Login e Cadastro)
// =====================================================

(function() {
    // Helper para obter o cliente Supabase padronizado no projeto
    function getSupabase() {
        return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || window.supabase;
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Vincula o formulário de login se existir na página
        const formLogin = document.getElementById("form-login");
        if (formLogin) {
            formLogin.addEventListener("submit", lidarComLogin);
        }

        // Vincula o formulário de cadastro se existir na página
        const formCadastro = document.getElementById("form-cadastro");
        if (formCadastro) {
            formCadastro.addEventListener("submit", lidarComCadastro);
        }
    });

    // -----------------------------------------------------
    // 1. FUNÇÃO DE LOGIN
    // -----------------------------------------------------
    async function lidarComLogin(event) {
        event.preventDefault();

        const supabase = getSupabase();
        if (!supabase) {
            mostrarMensagem("Erro de conexão com o Supabase.", "erro");
            return;
        }

        const emailInput = document.getElementById("email");
        const senhaInput = document.getElementById("senha");
        
        if (!emailInput || !senhaInput) return;

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (error) throw error;

            // Redireciona para o painel após o login bem-sucedido
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Erro no login:", error);
            mostrarMensagem("E-mail ou senha incorretos.", "erro");
        }
    }

    // -----------------------------------------------------
    // 2. FUNÇÃO DE CADASTRO DE NOVO USUÁRIO
    // -----------------------------------------------------
    async function lidarComCadastro(event) {
        event.preventDefault();

        const supabase = getSupabase();
        if (!supabase) {
            mostrarMensagem("Erro de conexão com o Supabase. Verifique o config.js.", "erro");
            return;
        }

        // Captura dos campos do formulário HTML com segurança
        const nome = document.getElementById("nome")?.value.trim() || "";
        const email = document.getElementById("email")?.value.trim() || "";
        const senha = document.getElementById("senha")?.value || "";
        const confirmarSenha = document.getElementById("confirmar-senha")?.value || "";
        
        const dataNascimento = document.getElementById("data-nascimento")?.value || null;
        const cartaoSus = document.getElementById("cartao-sus")?.value.trim() || null;
        
        const historicoUlcera = document.querySelector('input[name="historico_ulcera"]:checked')?.value || "sim";
        const dataCicatrizacao = document.getElementById("data-cicatrizacao")?.value || null;
        const historicoAmputacao = document.querySelector('input[name="amputacao"]:checked')?.value || "nao";
        const aceite = document.getElementById("aceite")?.checked || false;

        // Validações básicas
        if (!nome || !email || !senha) {
            mostrarMensagem("Preencha todos os campos obrigatórios de acesso.", "erro");
            return;
        }

        if (senha.length < 6) {
            mostrarMensagem("A senha precisa ter pelo menos 6 caracteres.", "erro");
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarMensagem("As senhas não coincidem.", "erro");
            return;
        }

        if (!aceite) {
            mostrarMensagem("Você deve aceitar os termos de apoio ao autocuidado.", "erro");
            return;
        }

        try {
            mostrarMensagem("Criando sua conta...", "sucesso");

            // 1. Criação da conta no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: senha
            });

            if (authError) throw authError;

            const userId = authData.user?.id;
            if (!userId) throw new Error("ID do usuário não retornado pela autenticação.");

            // 2. Inserção dos dados complementares na tabela perfis_usuarios
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
                        historico_amputacao: historicoAmputacao
                    }
                ]);

            if (perfilError) throw perfilError;

            mostrarMensagem("Conta criada com sucesso! Redirecionando...", "sucesso");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);

        } catch (error) {
            console.error("Erro detalhado no cadastro:", error);
            mostrarMensagem("Erro ao criar conta: " + (error.message || error), "erro");
        }
    }

    // -----------------------------------------------------
    // 3. AUXILIAR DE MENSAGENS NA TELA
    // -----------------------------------------------------
    function mostrarMensagem(mensagem, tipo) {
        const div = document.getElementById("mensagem");
        if (!div) {
            alert(mensagem);
            return;
        }

        div.textContent = mensagem;
        div.style.display = "block";
        div.className = tipo === "sucesso" ? "notificacao notificacao-sucesso" : "notificacao notificacao-erro";
    }
})();
