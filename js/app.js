// ==========================================
// PASSO SEGURO
// DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", iniciarSistema);

let usuario = null;


// ==========================================
// PASSO SEGURO
// INICIAR SISTEMA
// ==========================================

function iniciarSistema() {

    carregarUsuario();

    configurarMenu();

    abrirInicio();

}


// ==========================================
// PASSO SEGURO
// CARREGAR USUÁRIO
// ==========================================

function carregarUsuario() {

    usuario = JSON.parse(
        localStorage.getItem("usuario")
    );

    if (!usuario) {

        window.location.href = "login.html";
        return;

    }

    document.getElementById("nomeUsuario").innerHTML =
        "Olá, " + usuario.nome;

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
// INÍCIO
// ==========================================

function abrirInicio() {

    document.getElementById("conteudo").innerHTML = `

        <h2>🏠 Página Inicial</h2>

        <p>Bem-vindo ao Passo Seguro.</p>

        <h3>Cuidados Essenciais</h3>

        <ul>

            <li>✔ Examine os pés diariamente.</li>

            <li>✔ Hidrate a pele corretamente.</li>

            <li>✔ Nunca ande descalço.</li>

            <li>✔ Procure atendimento ao notar feridas.</li>

        </ul>

    `;

}


// ==========================================
// PASSO SEGURO
// PERFIL
// ==========================================

function abrirPerfil() {

    // Próxima etapa

}


// ==========================================
// PASSO SEGURO
// AVALIAÇÃO
// ==========================================

function abrirAvaliacao() {

    // Próxima etapa

}


// ==========================================
// PASSO SEGURO
// HISTÓRICO
// ==========================================

function abrirHistorico() {

    // Próxima etapa

}


// ==========================================
// PASSO SEGURO
// SAIR
// ==========================================

function sair() {

    localStorage.removeItem("usuario");

    window.location.href = "login.html";

}


// ==========================================
// PASSO SEGURO
// FUNÇÕES AUXILIARES
// ==========================================

function calcularIdade(dataNascimento) {

    if (!dataNascimento) return "";

    const hoje = new Date();

    const nascimento = new Date(dataNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const mes = hoje.getMonth() - nascimento.getMonth();

    if (

        mes < 0 ||

        (mes === 0 && hoje.getDate() < nascimento.getDate())

    ) {

        idade--;

    }

    return idade;

}
