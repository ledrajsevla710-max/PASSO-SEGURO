// ==========================================
// PASSO SEGURO
// DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", iniciarSistema);

let usuario = null;

function iniciarSistema() {

    usuario = JSON.parse(
        localStorage.getItem("usuario")
    );

    if (!usuario) {

        window.location.href = "login.html";
        return;

    }

    document.getElementById("nomeUsuario").innerHTML =
        "Olá, " + usuario.nome;

    configurarMenu();

    abrirInicio();

}
// ==========================================
// PASSO SEGURO
// CARREGAR USUÁRIO
// ==========================================
function carregarUsuario() {

    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (!usuario) {

        window.location = "login.html";
        return;

    }

    const nomeUsuario = document.getElementById("nomeUsuario");

    if (nomeUsuario) {

        nomeUsuario.innerText = "Olá, " + usuario.nome;

    }

}
// ==========================================
// PASSO SEGURO
// CONFIGURAR MENU
// ==========================================
function configurarMenu() {

    document.getElementById("btnHome").onclick = abrirInicio;

    document.getElementById("btnPerfil").onclick = abrirPerfil;

    document.getElementById("btnAvaliacao").onclick = abrirAvaliacao;

    document.getElementById("btnHistorico").onclick = abrirHistorico;

    document.getElementById("btnSair").onclick = sair;

}
// ==========================================
// PASSO SEGURO
// CONFIGURAR INICIO
// ==========================================
function abrirInicio() {

    document.getElementById("conteudo").innerHTML = `

        <h2>🏠 Página Inicial</h2>

        <p>Bem-vindo ao Passo Seguro.</p>

        <h3>Cuidados essenciais</h3>

        <ul>

            <li>✔ Examine os pés diariamente</li>

            <li>✔ Hidrate a pele</li>

            <li>✔ Nunca ande descalço</li>

            <li>✔ Procure atendimento ao notar feridas</li>

        </ul>

    `;

}
