// js/auth.js
// Autenticação do Passo Seguro (login, logout e verificação de sessão)

(function () {
  "use strict";

  // Aguarda o config.js e o Supabase estarem prontos
  const { supabaseClient, APP } = window.PASSO_SEGURO || {};

  if (!supabaseClient) {
    console.error("Passo Seguro: supabaseClient não disponível. Verifique o config.js.");
    return;
  }

  // ============================================
  // Funções auxiliares de interface
  // ============================================

  function mostrarMensagem(texto, tipo = "erro") {
    const el = document.getElementById("mensagem");
    if (!el) return;

    el.className = ""; // limpa classes anteriores
    el.classList.add("alerta");

    if (tipo === "sucesso") {
      el.classList.add("alerta-sucesso");
    } else if (tipo === "info") {
      el.classList.add("alerta-info");
    } else {
      el.classList.add("alerta-erro");
    }

    el.textContent = texto;
    el.classList.remove("escondido");
  }

  function esconderMensagem() {
    const el = document.getElementById("mensagem");
    if (el) {
      el.classList.add("escondido");
      el.textContent = "";
    }
  }

  function setBotaoCarregando(botao, carregando, textoOriginal) {
    if (!botao) return;
    botao.disabled = carregando;
    botao.textContent = carregando ? "Aguarde..." : textoOriginal;
  }

  // ============================================
  // Login
  // ============================================

  async function fazerLogin(email, senha) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password: senha
    });

    if (error) {
      throw error;
    }

    return data;
  }

  // ============================================
  // Logout
  // ============================================

  async function fazerLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error("Erro ao sair:", error.message);
    }
    // Sempre redireciona para o login
    window.location.href = "login.html";
  }

  // ============================================
  // Verificar se já existe sessão ativa
  // ============================================

  async function verificarSessao() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Erro ao verificar sessão:", error.message);
      return null;
    }

    return session;
  }

  // ============================================
  // Proteger páginas (redireciona se não estiver logado)
  // ============================================

  async function exigirAutenticacao() {
    const session = await verificarSessao();

    if (!session) {
      window.location.href = "login.html";
      return null;
    }

    return session;
  }

  // ============================================
  // Inicialização da página de Login
  // ============================================

  document.addEventListener("DOMContentLoaded", async () => {
    const formLogin = document.getElementById("form-login");
    const btnEntrar = document.getElementById("btn-entrar");

    // Se já estiver logado, redireciona para o dashboard
    const session = await verificarSessao();
    if (session && formLogin) {
      window.location.href = "dashboard.html";
      return;
    }

    // Configura o formulário de login
    if (formLogin) {
      formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        esconderMensagem();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {
          mostrarMensagem("Preencha e-mail e senha.");
          return;
        }

        setBotaoCarregando(btnEntrar, true, "Entrar");

        try {
          await fazerLogin(email, senha);
          // Login bem-sucedido → vai para o dashboard
          window.location.href = "dashboard.html";
        } catch (err) {
          console.error(err);
          let msg = "Não foi possível entrar. Verifique e-mail e senha.";

          if (err.message?.includes("Invalid login credentials")) {
            msg = "E-mail ou senha incorretos.";
          } else if (err.message?.includes("Email not confirmed")) {
            msg = "Confirme seu e-mail antes de entrar.";
          }

          mostrarMensagem(msg);
        } finally {
          setBotaoCarregando(btnEntrar, false, "Entrar");
        }
      });
    }

    // Botão de logout (presente em várias páginas)
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
      btnSair.addEventListener("click", async (e) => {
        e.preventDefault();
        await fazerLogout();
      });
    }
  });

  // ============================================
  // Exporta funções úteis para outros arquivos
  // ============================================

  window.Auth = {
    fazerLogin,
    fazerLogout,
    verificarSessao,
    exigirAutenticacao,
    mostrarMensagem
  };
})();
