// =====================================================
// PASSO SEGURO
// Arquivo: js/auth.js
// Autenticação real (Login + Cadastro) com Supabase
// =====================================================

(function () {
    function getSupabase() {
        return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || null;
    }

    function iniciarAutenticacao() {
        verificarSessaoExistente();

        const formLogin = document.getElementById("form-login");
        if (formLogin) {
            formLogin.addEventListener("submit", lidarComLogin);
        }

        const formCadastro = document.getElementById("form-cadastro");
        if (formCadastro) {
            formCadastro.addEventListener("submit", lidarComCadastro);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarAutenticacao);
    } else {
        iniciarAutenticacao();
    }

    // -------------------------------------------------
    // Verifica se já existe sessão
    // -------------------------------------------------
    async function verificarSessaoExistente() {
        const supabase = getSupabase();
        if (!supabase) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            console.warn("Erro ao verificar sessão:", error);
        }
    }

    // -------------------------------------------------
    // LOGIN
    // -------------------------------------------------
    async function lidarComLogin(event) {
        event.preventDefault();

        const supabase = getSupabase();
        if (!supabase) {
            mostrarMensagem("Erro de conexão com o sistema. Recarregue a página.", "erro");
            return;
        }

        const email = document.getElementById("email")?.value.trim();
        const senha = document.getElementById("senha")?.value;

        if (!email || !senha) {
            mostrarMensagem("Preencha e-mail e senha.", "erro");
            return;
        }

        try {
            mostrarMensagem("Entrando...", "sucesso");

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: senha
            });

            if (error) throw error;

            // Busca o nome para mostrar no dashboard
            if (data.user) {
                const { data: perfil } = await supabase
                    .from("perfis_usuarios")
                    .select("nome_completo")
                    .eq("id", data.user.id)
                    .single();

                if (perfil?.nome_completo) {
                    localStorage.setItem("usuario_nome", perfil.nome_completo);
                }
            }

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Erro no login:", error);
            let msg = "Não foi possível entrar. Verifique e-mail e senha.";

            if (error.message?.includes("Invalid login credentials")) {
                msg = "E-mail ou senha incorretos.";
            } else if (error.message?.includes("Email not confirmed")) {
                msg = "Confirme seu e-mail antes de entrar.";
            }

            mostrarMensagem(msg, "erro");
        }
    }

    // -------------------------------------------------
    // CADASTRO
    // -------------------------------------------------
    async function lidarComCadastro(event) {
        event.preventDefault();

        const supabase = getSupabase();
        if (!supabase) {
            mostrarMensagem("Erro de conexão com o sistema. Recarregue a página.", "erro");
            return;
        }

        // Captura de todos os campos
        const nome = document.getElementById("nome")?.value.trim() || "";
        const email = document.getElementById("email")?.value.trim() || "";
        const senha = document.getElementById("senha")?.value || "";
        const confirmarSenha = document.getElementById("confirmar-senha")?.value || "";

        const dataNascimento = document.getElementById("data-nascimento")?.value || null;
        const cartaoSus = document.getElementById("cartao-sus")?.value.trim() || null;

        const historicoUlcera = document.querySelector('input[name="historico_ulcera"]:checked')?.value || "sim";
        const dataCicatrizacao = document.getElementById("data-cicatrizacao")?.value || null;
        const historicoAmputacao = document.querySelector('input[name="amputacao"]:checked')?.value || "nao";
        const temCuidador = document.querySelector('input[name="tem_cuidador"]:checked')?.value || "nao";
        const aceite = document.getElementById("aceite")?.checked || false;

        // Validações
        if (!nome) {
            mostrarMensagem("Por favor, preencha o seu nome completo.", "erro");
            return;
        }
        if (!email) {
            mostrarMensagem("Por favor, preencha o e-mail.", "erro");
            return;
        }
        if (!senha || senha.length < 6) {
            mostrarMensagem("A senha deve ter no mínimo 6 caracteres.", "erro");
            return;
        }
        if (senha !== confirmarSenha) {
            mostrarMensagem("As senhas não coincidem.", "erro");
            return;
        }
        if (!aceite) {
            mostrarMensagem("Você precisa aceitar o termo para continuar.", "erro");
            return;
        }

        try {
            mostrarMensagem("Criando sua conta...", "sucesso");

            // 1. Cria o usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: senha,
                options: {
                    data: {
                        nome_completo: nome
                    }
                }
            });

            if (authError) throw authError;

            const user = authData.user;
            if (!user) {
                throw new Error("Não foi possível criar o usuário.");
            }

            // 2. Salva TODOS os dados do perfil na tabela
            const { error: perfilError } = await supabase
                .from("perfis_usuarios")
                .insert([{
                    id: user.id,                        // ID real do Auth
                    nome_completo: nome,
                    data_nascimento: dataNascimento,
                    cartao_sus: cartaoSus,
                    possui_diabetes: "sim",
                    historico_ulcera: historicoUlcera,
                    data_cicatrizacao: dataCicatrizacao,
                    historico_amputacao: historicoAmputacao,
                    tem_cuidador: temCuidador
                }]);

            if (perfilError) {
                console.error("Erro ao salvar perfil:", perfilError);
                // Mesmo com erro no perfil, o usuário já foi criado no Auth
            }

            // Salva o nome localmente
            localStorage.setItem("usuario_nome", nome);

            mostrarMensagem("Conta criada com sucesso! Entrando...", "sucesso");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);

        } catch (error) {
            console.error("Erro no cadastro:", error);

            let msg = "Não foi possível criar a conta. Tente novamente.";

            if (error.message?.includes("User already registered")) {
                msg = "Este e-mail já está cadastrado. Tente fazer login.";
            } else if (error.message?.includes("Password should be")) {
                msg = "A senha não atende aos requisitos de segurança.";
            } else if (error.message) {
                msg = error.message;
            }

            mostrarMensagem(msg, "erro");
        }
    }

    // -------------------------------------------------
    // Mensagens
    // -------------------------------------------------
    function mostrarMensagem(mensagem, tipo) {
        const div = document.getElementById("mensagem");
        if (!div) {
            alert(mensagem);
            return;
        }

        div.textContent = mensagem;
        div.style.display = "block";
        div.className = tipo === "sucesso"
            ? "notificacao notificacao-sucesso"
            : "notificacao notificacao-erro";
    }
})();
