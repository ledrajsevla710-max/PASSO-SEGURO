// ==========================================
// PASSO SEGURO
// DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", iniciarSistema);

function iniciarSistema() {

    carregarUsuario();

    configurarMenu();

    abrirInicio();

}
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
function configurarMenu() {

    document.getElementById("btnHome").onclick = abrirInicio;

    document.getElementById("btnPerfil").onclick = abrirPerfil;

    document.getElementById("btnAvaliacao").onclick = abrirAvaliacao;

    document.getElementById("btnHistorico").onclick = abrirHistorico;

    document.getElementById("btnSair").onclick = sair;

}
