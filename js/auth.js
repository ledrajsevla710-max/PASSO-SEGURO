// =====================================================
// PASSO SEGURO
// Arquivo: js/auth.js
// Modo simplificado (sem login obrigatório para testes)
// =====================================================

(function() {
    function getSupabase() {
        return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || window.supabase;
    }

    function iniciarAutenticacao() {
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

    async function lidarComLogin(event) {
        event.preventDefault();
        window.location.href = "dashboard.html";
    }

    async function lidarComCadastro(event) {
        event.preventDefault();

        const supabase = getSupabase();
        
        // Captura dos campos do formulário HTML
        const nome = document.getElementById("nome")?.value.trim() || "";
        const email = document.getElementById("email")?.value.trim() || "teste@passoseguro.com";
        
        const dataNascimento = document.getElementById("data-nascimento")?.value || null;
        const cartaoSus = document.getElementById("cartao-sus")?.value.trim() || null;
        
        const historicoUlcera = document.querySelector('input[name="historico_ulcera"]:checked')?.value || "sim";
        const dataCicatrizacao = document.getElementById("data-cicatrizacao")?.value || null;
        const historicoAmputacao = document.querySelector('input[name="amputacao"]:checked')?.value || "nao";
        const aceite = document.getElementById("aceite")?.checked || true;

        if (!nome) {
            mostrarMensagem("Por favor, preencha o seu nome completo.", "erro");
            return;
        }

        try {
            mostrarMensagem("Salvando seus dados...", "sucesso");

            // Gera um ID único de teste caso o Supabase Auth esteja desligado
            const userIdTemp = "user_" + Math.random().toString(36).substring(2, 15);

            if (supabase) {
                // Tenta salvar diretamente na tabela de perfis sem exigir senha
                await supabase
                    .from("perfis_usuarios")
                    .insert([
                        {
                            id: userIdTemp,
                            nome_completo: nome,
                            data_nascimento: dataNascimento,
                            cartao_sus: cartaoSus,
                            possui_diabetes: "sim",
                            historico_ulcera: historicoUlcera,
                            data_cicatrizacao: dataCicatrizacao,
                            historico_amputacao: historicoAmputacao
                        }
                    ]);
            }

            // Salva o nome no navegador para exibir no dashboard
            localStorage.setItem("usuario_nome", nome);

            mostrarMensagem("Entrando no sistema...", "sucesso");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);

        } catch (error) {
            console.error("Erro no cadastro simplificado:", error);
            // Mesmo se a tabela recusar, deixa entrar no dashboard para não travar o teste
            window.location.href = "dashboard.html";
        }
    }

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
