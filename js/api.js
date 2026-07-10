// ==========================================
// API E INTERFACE - CÓDIGO COMPLETO E SEGURO
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbxEvckYixVIEZcOiNjw2p3feEUT8UvLhSrrm0ERxqYf4jGeWwBbh3kg6K_ZOAPUKYSD/exec";

// Comunicação
async function enviar(dados) {
    const resposta = await fetch(API_URL, { 
        method: "POST", 
        headers: {"Content-Type": "text/plain;charset=utf-8"}, 
        body: JSON.stringify(dados) 
    });
    return await resposta.json();
}

window.enviar = enviar;
window.salvarAvaliacaoAPI = async (a) => await enviar({ acao: "avaliacao", avaliacao: a });

document.addEventListener("DOMContentLoaded", () => {
    // 1. Definição de elementos e proteção contra erros
    const conteudo = document.getElementById("conteudo");
    if (!conteudo) return; // Se não houver div de conteúdo, para o script para evitar erro

    const u = {
        nome: localStorage.getItem("nome") || "Paciente",
        email: localStorage.getItem("email"),
        nascimento: localStorage.getItem("nascimento"),
        cidade: localStorage.getItem("cidade")
    };

    const nomeUI = document.getElementById("nomeUsuario");
    if (u.nome && nomeUI) nomeUI.innerText = "Olá, " + u.nome;

    // 2. Navegação: Início
    const btnHome = document.getElementById("btnHome");
    if(btnHome) btnHome.onclick = () => {
        conteudo.innerHTML = `<h2>🏠 Início</h2><p>Bem-vindo ao Passo Seguro.</p>`;
    };

    // 3. Navegação: Perfil
    const btnPerfil = document.getElementById("btnPerfil");
    if(btnPerfil) btnPerfil.onclick = () => {
        conteudo.innerHTML = `<h2>👤 Perfil</h2><p>Nome: ${u.nome}<br>Cidade: ${u.cidade}</p>`;
    };

    // 4. Navegação: Avaliação (O código que você já tinha)
    const btnAvaliacao = document.getElementById("btnAvaliacao");
    if (btnAvaliacao) {
        btnAvaliacao.onclick = () => {
            conteudo.innerHTML = `
                <h2>🩺 Nova Avaliação</h2>
                <div class="card">
                    <label>Possui calosidade?</label>
                    <select id="avalCalosidade"><option>Não</option><option>Sim</option></select>
                    <label>Possui úlcera?</label>
                    <select id="avalUlcera"><option>Não</option><option>Sim</option></select>
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
                    risco: document.getElementById("avalRisco").value,
                    data: new Date().toLocaleDateString()
                };
                const btn = document.getElementById("btnSalvarAval");
                btn.innerText = "Salvando...";
                const resp = await window.salvarAvaliacaoAPI(dados);
                alert(resp.mensagem);
                btn.innerText = "Salvar Avaliação";
            };
        };
    }

    // 5. Sair
    const btnSair = document.getElementById("btnSair");
    if(btnSair) btnSair.onclick = () => { localStorage.clear(); window.location = "login.html"; };
});
