// ==========================================
// API E INTERFACE - CÓDIGO COMPLETO
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbxiqXvtwk2n63j16cw6t6djePX6LNIkqfFFD2eJxGbEZ-YAWh1TgnluSgmtZlVGD-YR/exec";

// Funções de Comunicação
async function enviar(dados) {
    const resposta = await fetch(API_URL, { method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(dados) });
    return await resposta.json();
}

window.enviar = enviar;
window.cadastrar = async (u) => await enviar({ acao: "cadastro", usuario: u });
window.atualizarPerfil = async (u) => await enviar({ acao: "perfil", usuario: u });
window.salvarAvaliacaoAPI = async (a) => await enviar({ acao: "avaliacao", avaliacao: a });

// Lógica do Dashboard
document.addEventListener("DOMContentLoaded", () => {
    const u = {
        nome: localStorage.getItem("nome"),
        email: localStorage.getItem("email"),
        nascimento: localStorage.getItem("nascimento"),
        cidade: localStorage.getItem("cidade"),
        uf: localStorage.getItem("uf")
    };

    const nomeUI = document.getElementById("nomeUsuario");
    if (u.nome && nomeUI) nomeUI.innerText = "Olá, " + u.nome;

    // Avaliação (Automática)
    const btnAvaliacao = document.getElementById("btnAvaliacao");
    if (btnAvaliacao) {
        btnAvaliacao.onclick = () => {
            document.getElementById("conteudo").innerHTML = `
                <h2>🩺 Nova Avaliação</h2>
                <div class="card">
                    <p>Paciente: <b>${u.nome}</b></p>
                    <label>Possui calosidade?</label>
                    <select id="avalCalosidade"><option>Não</option><option>Sim</option></select>
                    <label>Possui úlcera?</label>
                    <select id="avalUlcera"><option>Não</option><option>Sim</option></select>
                    <label>Já realizou amputação?</label>
                    <select id="avalAmputacao"><option>Não</option><option>Sim</option></select>
                    <label>Local da amputação</label><input type="text" id="avalLocalAmputacao">
                    <label>Nível de risco</label>
                    <select id="avalRisco"><option>Baixo</option><option>Moderado</option><option>Alto</option></select>
                    <button id="btnSalvarAval">Salvar Avaliação</button>
                </div>`;
            
            document.getElementById("btnSalvarAval").onclick = async () => {
                const nasci = new Date(u.nascimento);
                const idade = new Date().getFullYear() - nasci.getFullYear();
                const dados = {
                    email: u.email, nome: u.nome, idade: idade, cidade: u.cidade,
                    calosidade: document.getElementById("avalCalosidade").value,
                    ulcera: document.getElementById("avalUlcera").value,
                    amputacao: document.getElementById("avalAmputacao").value,
                    localAmputacao: document.getElementById("avalLocalAmputacao").value,
                    risco: document.getElementById("avalRisco").value,
                    data: new Date().toLocaleDateString()
                };
                const resp = await window.salvarAvaliacaoAPI(dados);
                alert(resp.mensagem);
            };
        };
    }

    const btnSair = document.getElementById("btnSair");
    if(btnSair) btnSair.onclick = () => { localStorage.clear(); window.location = "login.html"; };
});
