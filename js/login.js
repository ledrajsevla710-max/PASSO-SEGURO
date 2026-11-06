// js/login.js
// Lógica de Autenticação e Cadastro Seguros com Supabase

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");

    // 1. Processo de Login
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email-login").value.trim();
            const senha = document.getElementById("senha-login").value;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: senha,
                });

                if (error) throw error;

                alert("Login realizado com sucesso!");
                window.location.href = "dashboard.html";
            } catch (error) {
                alert("Erro ao entrar: " + error.message);
                console.error("Erro de login:", error);
            }
        });
    }

    // 2. Processo de Cadastro
    if (formCadastro) {
        formCadastro.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-cadastro").value.trim();
            const email = document.getElementById("email-cadastro").value.trim();
            const senha = document.getElementById("senha-cadastro").value;
            const tipoUsuario = document.getElementById("tipo-usuario") ? document.getElementById("tipo-usuario").value : "paciente";

            try {
                // Cria o usuário na autenticação do Supabase
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email: email,
                    password: senha,
                });

                if (authError) throw authError;

                if (authData.user) {
                    // Insere o perfil correspondente na tabela 'profiles'
                    const { error: profileError } = await supabaseClient
                        .from("profiles")
                        .insert([
                            {
                                id: authData.user.id,
                                nome_completo: nome,
                                tipo_usuario: tipoUsuario
                            }
                        ]);

                    if (profileError) throw profileError;
                }

                alert("Cadastro realizado com sucesso! Verifique seu e-mail se necessário ou faça login.");
                window.location.href = "login.html";
            } catch (error) {
                alert("Erro ao cadastrar: " + error.message);
                console.error("Erro de cadastro:", error);
            }
        });
    }
});
