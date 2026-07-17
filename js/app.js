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
