// js/login.js
// Lógica de Autenticação e Cadastro Seguros com Supabase (Passo Seguro SESAPI/HGV)

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");

    // 1. Processo de Login Seguro
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email-login").value.trim();
            const senha = document.getElementById("senha-login").value;

            try {
                if (typeof window.supabase === 'undefined') {
                    throw new Error("Cliente Supabase não inicializado.");
                }

                // Autenticação no Auth do Supabase
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email: email,
                    password: senha,
                });

                if (error) throw error;

                // Verifica o perfil na tabela perfis_usuarios para checar se profissional está aprovado
                const { data: perfil, error: errPerfil } = await window.supabase
                    .from("perfis_usuarios")
                    .select("*")
                    .eq("id", data.user.id)
                    .single();

                if (errPerfil || !perfil) {
                    throw new Error("Perfil institucional não encontrado no banco de dados.");
                }

                // Validação de segurança: Profissionais não aprovados não entram
                if (perfil.tipo === 'profissional' && !perfil.aprovado) {
                    await window.supabase.auth.signOut();
                    alert("Acesso pendente! Seu cadastro profissional aguarda liberação da moderação SESAPI/HGV.");
                    return;
                }

                alert("Login realizado com sucesso!");
                
                // Redireciona conforme o tipo de usuário
                if (perfil.tipo === 'profissional') {
                    window.location.href = "profissional.html";
                } else {
                    window.location.href = "dashboard.html";
                }

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
            const coren = document.getElementById("coren-cadastro") ? document.getElementById("coren-cadastro").value.trim() : null;

            if (tipoUsuario === 'profissional' && !coren) {
                alert("Por favor, informe o número do COREN para o cadastro profissional.");
                return;
            }

            try {
                if (typeof window.supabase === 'undefined') {
                    throw new Error("Cliente Supabase não inicializado.");
                }

                // Profissionais nascem com aprovado = false (Estratégia de Segurança)
                const aprovadoInicial = (tipoUsuario === 'paciente');

                // Cria o usuário na autenticação do Supabase
                const { data: authData, error: authError } = await window.supabase.auth.signUp({
                    email: email,
                    password: senha,
                    options: {
                        data: {
                            nome: nome,
                            tipo: tipoUsuario
                        }
                    }
                });

                if (authError) throw authError;

                if (authData.user) {
                    // Insere o perfil correspondente na tabela unificada 'perfis_usuarios'
                    const { error: profileError } = await window.supabase
                        .from("perfis_usuarios")
                        .insert([
                            {
                                id: authData.user.id,
                                email: email,
                                nome_completo: nome,
                                tipo: tipoUsuario,
                                coren: coren,
                                aprovado: aprovadoInicial
                            }
                        ]);

                    if (profileError) throw profileError;
                }

                if (tipoUsuario === 'profissional') {
                    alert("Cadastro realizado com sucesso! Sua conta profissional aguarda liberação da moderação SESAPI/HGV para acesso.");
                } else {
                    alert("Cadastro de paciente realizado com sucesso! Faça login para continuar.");
                }
                
                formCadastro.reset();
            } catch (error) {
                alert("Erro ao cadastrar: " + error.message);
                console.error("Erro de cadastro:", error);
            }
        });
    }
});
