
// =====================================================
// PASSO SEGURO
// Arquivo: js/auth.js
// AUTENTICAÇÃO REAL - SUPABASE
// Login + Cadastro + Recuperação de Perfil
// =====================================================

(function () {
    "use strict";

    // -------------------------------------------------
    // SUPABASE
    // -------------------------------------------------

    function getSupabase() {
        return window.supabaseClient ||
            window.PASSO_SEGURO?.supabaseClient ||
            null;
    }

    // -------------------------------------------------
    // INICIALIZAÇÃO
    // -------------------------------------------------

    function iniciarAutenticacao() {

        const formLogin = document.getElementById("form-login");
        const formCadastro = document.getElementById("form-cadastro");

        if (formLogin) {
            verificarSessaoExistente();

            formLogin.addEventListener("submit", lidarComLogin);
        }

        if (formCadastro) {
            verificarSessaoExistente();

            formCadastro.addEventListener("submit", lidarComCadastro);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            iniciarAutenticacao
        );
    } else {
        iniciarAutenticacao();
    }

    // -------------------------------------------------
    // FUNÇÕES AUXILIARES
    // -------------------------------------------------

    function obterValor(id) {
        return document.getElementById(id)?.value?.trim() || "";
    }

    function obterRadio(nome, padrao = "nao") {
        return document.querySelector(
            `input[name="${nome}"]:checked`
        )?.value?.trim().toLowerCase() || padrao;
    }

    function normalizarOpcao(valor) {
        if (!valor) return "nao";

        const resposta = valor.toLowerCase();

        if (resposta === "não") return "nao";

        return resposta;
    }

    function mostrarMensagem(mensagem, tipo = "erro") {

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

    function salvarNomeLocal(nome) {
        if (nome) {
            localStorage.setItem("usuario_nome", nome);
        }
    }

    // -------------------------------------------------
    // VERIFICAR SESSÃO
    // -------------------------------------------------

    async function verificarSessaoExistente() {

        const supabase = getSupabase();

        if (!supabase) return;

        try {

            const { data, error } =
                await supabase.auth.getSession();

            if (error) throw error;

            if (data.session) {
                window.location.replace("dashboard.html");
            }

        } catch (error) {
            console.error(
                "Erro ao verificar sessão:",
                error
            );
        }
    }

    // -------------------------------------------------
    // MONTAR DADOS DO PERFIL
    // -------------------------------------------------

    function montarPerfil(user, dados = {}) {

        return {
            id: user.id,

            nome_completo:
                dados.nome_completo ||
                user.user_metadata?.nome_completo ||
                "",

            data_nascimento:
                dados.data_nascimento || null,

            telefone:
                dados.telefone || null,

            cidade:
                dados.cidade || null,

            uf:
                dados.uf || null,

            cartao_sus:
                dados.cartao_sus || null,

            possui_diabetes:
                dados.possui_diabetes || "nao",

            historico_ulcera:
                dados.historico_ulcera || "nao",

            data_cicatrizacao:
                dados.data_cicatrizacao || null,

            historico_amputacao:
                dados.historico_amputacao || "nao",

            local_amputacao:
                dados.local_amputacao || null
        };
    }

    // -------------------------------------------------
    // GARANTIR QUE O PERFIL EXISTA
    // -------------------------------------------------

    async function garantirPerfil(supabase, user) {

        const { data: perfil, error: consultaError } =
            await supabase
                .from("perfis_usuarios")
                .select("id, nome_completo")
                .eq("id", user.id)
                .maybeSingle();

        if (consultaError) {
            throw consultaError;
        }

        // Perfil já existe: não sobrescrever os dados.
        if (perfil) {
            salvarNomeLocal(perfil.nome_completo);
            return perfil;
        }

        // Perfil ainda não existe.
        // Recupera os dados guardados no cadastro do Auth.

        const metadata = user.user_metadata || {};

        const novosDados = montarPerfil(user, metadata);

        if (!novosDados.nome_completo) {
            throw new Error(
                "Não foi possível recuperar o nome do cadastro."
            );
        }

        const { data: novoPerfil, error: insercaoError } =
            await supabase
                .from("perfis_usuarios")
                .insert(novosDados)
                .select()
                .single();

        if (insercaoError) {
            throw insercaoError;
        }

        salvarNomeLocal(novoPerfil.nome_completo);

        return novoPerfil;
    }

    // -------------------------------------------------
    // LOGIN
    // -------------------------------------------------

    async function lidarComLogin(event) {

        event.preventDefault();

        const supabase = getSupabase();

        if (!supabase) {
            mostrarMensagem(
                "Erro de conexão com o sistema.",
                "erro"
            );
            return;
        }

        const email = obterValor("email");
        const senha =
            document.getElementById("senha")?.value || "";

        if (!email || !senha) {
            mostrarMensagem(
                "Preencha e-mail e senha.",
                "erro"
            );
            return;
        }

        try {

            mostrarMensagem("Entrando...", "sucesso");

            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email,
                    password: senha
                });

            if (error) throw error;

            if (!data.user) {
                throw new Error(
                    "Usuário não encontrado."
                );
            }

            // Garante que o perfil exista.
            const perfil = await garantirPerfil(
                supabase,
                data.user
            );

            salvarNomeLocal(perfil.nome_completo);

            mostrarMensagem(
                "Login realizado com sucesso!",
                "sucesso"
            );

            window.location.replace("dashboard.html");

        } catch (error) {

            console.error("Erro no login:", error);

            let mensagem =
                "Não foi possível entrar. Verifique seus dados.";

            if (
                error.message?.includes(
                    "Invalid login credentials"
                )
            ) {
                mensagem = "E-mail ou senha incorretos.";

            } else if (
                error.message?.includes(
                    "Email not confirmed"
                )
            ) {
                mensagem = "Confirme seu e-mail antes de entrar.";

            } else if (error.message) {
                mensagem = error.message;
            }

            mostrarMensagem(mensagem, "erro");
        }
    }

    // -------------------------------------------------
    // CADASTRO
    // -------------------------------------------------

    async function lidarComCadastro(event) {

        event.preventDefault();

        const supabase = getSupabase();

        if (!supabase) {
            mostrarMensagem(
                "Erro de conexão com o sistema.",
                "erro"
            );
            return;
        }

        // ---------------------------------------------
        // CAPTURA DOS CAMPOS
        // ---------------------------------------------

        const nome = obterValor("nome");
        const email = obterValor("email");

        const senha =
            document.getElementById("senha")?.value || "";

        const confirmarSenha =
            document.getElementById("confirmar-senha")?.value || "";

        const dataNascimento =
            obterValor("data-nascimento") || null;

        const telefone = obterValor("telefone") || null;

        const cidade = obterValor("cidade") || null;

        const uf =
            obterValor("uf").toUpperCase() || null;

        const cartaoSus =
            obterValor("cartao-sus") || null;

        const possuiDiabetes = normalizarOpcao(
            obterRadio("possui_diabetes")
        );

        const historicoUlcera = normalizarOpcao(
            obterRadio("historico_ulcera")
        );

        const dataCicatrizacao =
            obterValor("data-cicatrizacao") || null;

        const historicoAmputacao = normalizarOpcao(
            obterRadio("amputacao")
        );

        const localAmputacao =
            obterValor("local-amputacao") || null;

        const aceite =
            document.getElementById("aceite")?.checked || false;

        // ---------------------------------------------
        // VALIDAÇÕES
        // ---------------------------------------------

        if (!nome) {
            mostrarMensagem(
                "Preencha seu nome completo.",
                "erro"
            );
            return;
        }

        if (!email) {
            mostrarMensagem(
                "Preencha seu e-mail.",
                "erro"
            );
            return;
        }

        if (!senha || senha.length < 6) {
            mostrarMensagem(
                "A senha deve ter no mínimo 6 caracteres.",
                "erro"
            );
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarMensagem(
                "As senhas não coincidem.",
                "erro"
            );
            return;
        }

        if (uf && !/^[A-Z]{2}$/.test(uf)) {
            mostrarMensagem(
                "Informe uma UF válida com duas letras.",
                "erro"
            );
            return;
        }

        if (!aceite) {
            mostrarMensagem(
                "Você precisa aceitar o termo para continuar.",
                "erro"
            );
            return;
        }

        // ---------------------------------------------
        // DADOS DO PERFIL
        // ---------------------------------------------

        const dadosPerfil = {
            nome_completo: nome,
            data_nascimento: dataNascimento,
            telefone,
            cidade,
            uf,
            cartao_sus: cartaoSus,
            possui_diabetes: possuiDiabetes,
            historico_ulcera: historicoUlcera,
            data_cicatrizacao: dataCicatrizacao,
            historico_amputacao: historicoAmputacao,
            local_amputacao: localAmputacao
        };

        try {

            mostrarMensagem(
                "Criando sua conta...",
                "sucesso"
            );

            // -----------------------------------------
            // 1. CRIAR USUÁRIO NO SUPABASE AUTH
            // -----------------------------------------

            const { data: authData, error: authError } =
                await supabase.auth.signUp({
                    email,
                    password: senha,

                    options: {
                        data: dadosPerfil
                    }
                });

            if (authError) throw authError;

            const user = authData.user;

            if (!user) {
                throw new Error(
                    "Não foi possível criar sua conta."
                );
            }

            // -----------------------------------------
            // 2. VERIFICAR SESSÃO
            // -----------------------------------------

            if (!authData.session) {

                mostrarMensagem(
                    "Conta criada! Verifique seu e-mail para confirmar o cadastro. Depois, faça login para concluir a criação do perfil.",
                    "sucesso"
                );

                return;
            }

            // -----------------------------------------
            // 3. CRIAR PERFIL NO BANCO
            // -----------------------------------------

            const perfilCompleto = montarPerfil(
                user,
                dadosPerfil
            );

            const { data: perfil, error: perfilError } =
                await supabase
                    .from("perfis_usuarios")
                    .insert(perfilCompleto)
                    .select()
                    .single();

            if (perfilError) {
                console.error(
                    "Erro ao salvar perfil:",
                    perfilError
                );

                throw new Error(
                    "A conta foi criada, mas não foi possível salvar o perfil. Faça login novamente para tentar recuperar os dados."
                );
            }

            // -----------------------------------------
            // 4. SALVAR NOME LOCALMENTE
            // -----------------------------------------

            salvarNomeLocal(perfil.nome_completo);

            // -----------------------------------------
            // 5. REDIRECIONAR
            // -----------------------------------------

            mostrarMensagem(
                "Cadastro realizado com sucesso!",
                "sucesso"
            );

            window.location.replace("dashboard.html");

        } catch (error) {

            console.error(
                "Erro no cadastro:",
                error
            );

            let mensagem =
                "Não foi possível concluir o cadastro.";

            if (
                error.message?.includes(
                    "User already registered"
                )
            ) {
                mensagem =
                    "Este e-mail já está cadastrado. Faça login.";

            } else if (
                error.message?.includes(
                    "Password should be"
                )
            ) {
                mensagem =
                    "A senha não atende aos requisitos de segurança.";

            } else if (error.message) {
                mensagem = error.message;
            }

            mostrarMensagem(mensagem, "erro");
        }
    }

})();
