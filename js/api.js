// ==========================================
// PARTE 1: API (Comunicação com o Google)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbxiqXvtwk2n63j16cw6t6djePX6LNIkqfFFD2eJxGbEZ-YAWh1TgnluSgmtZlVGD-YR/exec";

async function enviar(dados) {
    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        return await resposta.json();

    } catch (erro) {
        console.error("Erro API:", erro);
        return { sucesso: false, mensagem: "Erro de conexão com a API." };
    }
}

async function cadastrar(usuario) {
    return await enviar({ acao: "cadastro", usuario: usuario });
}

async function atualizarPerfil(usuario) {
    return await enviar({ acao: "perfil", usuario: usuario });
}

async function salvarAvaliacaoAPI(avaliacao) {
    return await enviar({ acao: "avaliacao", avaliacao: avaliacao });
}

async function carregarHistoricoAPI(email) {
    return await enviar({ acao: "historico", email: email });
}

// Tornando as funções globais
window.atualizarPerfil = atualizarPerfil;
window.salvarAvaliacaoAPI = salvarAvaliacaoAPI;
window.carregarHistoricoAPI = carregarHistoricoAPI;


// ==========================================
// PARTE 2: INTERFACE (Cliques e Telas)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const usuario = localStorage.getItem("usuario"); // Nome do usuário
    const emailUsuario = localStorage.getItem("email"); // O e-mail precisa estar salvo no login!
    const nomeUsuario = document.getElementById("nomeUsuario");

    if (usuario && nomeUsuario) {
        nomeUsuario.innerText = "Olá, " + usuario;
    }

    // ===============================
    // INÍCIO
    // ===============================
    const btnHome = document.getElementById("btnHome");
    if (btnHome) {
        btnHome.onclick = () => {
            document.getElementById("conteudo").innerHTML = `
                <h2>🏠 Página Inicial</h2>
                <p>Bem-vindo ao Passo Seguro.</p>
                <h3>Cuidados essenciais:</h3>
                <ul>
                    <li>✔ Examine os pés diariamente</li>
                    <li>✔ Hidrate a pele corretamente</li>
                    <li>✔ Não use calçados apertados</li>
                    <li>✔ Procure ajuda profissional em caso de feridas</li>
                </ul>
            `;
        };
    }

    // ===============================
    // PERFIL
    // ===============================
    const btnPerfil = document.getElementById("btnPerfil");
    if (btnPerfil) {
        btnPerfil.onclick = () => {
            document.getElementById("conteudo").innerHTML = `
                <h2>👤 Perfil do Paciente</h2>
                <div class="card">
                    <label>Nome</label>
                    <input type="text" id="perfilNome" value="${usuario || ''}">
                    
                    <label>E-mail</label>
                    <input type="email" id="perfilEmail" value="${emailUsuario || ''}" readonly>
                    
                    <label>Telefone</label>
                    <input type="text" id="perfilTelefone">
                    
                    <label>Data de nascimento</label>
                    <input type="date" id="perfilNascimento">
                    
                    <label>Cidade</label>
                    <input type="text" id="perfilCidade">
                    
                    <label>Estado</label>
                    <select id="perfilUf">
                        <option>PI</option>
                        <option>MA</option>
                        <option>CE</option>
                        <option>BA</option>
                        <option>PE</option>
                    </select>
                    
                    <button id="salvarPerfil">Salvar Perfil</button>
                </div>
            `;

            const btnSalvarPerfil = document.getElementById("salvarPerfil");
            if (btnSalvarPerfil) {
                btnSalvarPerfil.onclick = async () => {
                    const perfil = {
                        nome: document.getElementById("perfilNome").value,
                        email: document.getElementById("perfilEmail").value, // Usado para buscar na planilha
                        telefone: document.getElementById("perfilTelefone").value,
                        nascimento: document.getElementById("perfilNascimento").value,
                        cidade: document.getElementById("perfilCidade").value,
                        uf: document.getElementById("perfilUf").value
                    };

                    btnSalvarPerfil.innerText = "Salvando...";
                    
                    // Chama a função da API que está na PARTE 1
                    const resposta = await window.atualizarPerfil(perfil);

                    alert(resposta.mensagem);
                    btnSalvarPerfil.innerText = "Salvar Perfil";
                };
            }
        };
    }

    // ===============================
    // AVALIAÇÃO
    // ===============================
    const btnAvaliacao = document.getElementById("btnAvaliacao");
    if (btnAvaliacao) {
        btnAvaliacao.onclick = () => {
            document.getElementById("conteudo").innerHTML = `
                <h2>🩺 Avaliação dos Pés</h2>
                <div class="card">
                    <label>Possui calosidade?</label>
                    <select id="avalCalosidade">
                        <option>Não</option>
                        <option>Sim</option>
                    </select>
                    
                    <label>Possui úlcera?</label>
                    <select id="avalUlcera">
                        <option>Não</option>
                        <option>Sim</option>
                    </select>
                    
                    <label>Já realizou amputação?</label>
                    <select id="avalAmputacao">
                        <option>Não</option>
                        <option>Sim</option>
                    </select>
                    
                    <label>Local da amputação</label>
                    <input type="text" id="avalLocalAmputacao" placeholder="Se não, deixe em branco">
                    
                    <label>Nível de risco</label>
                    <select id="avalRisco">
                        <option>Baixo</option>
                        <option>Moderado</option>
                        <option>Alto</option>
                    </select>
                    
                    <button id="salvarAvaliacao">Salvar Avaliação</button>
                </div>
            `;

            const btnSalvarAvaliacao = document.getElementById("salvarAvaliacao");
            if (btnSalvarAvaliacao) {
                btnSalvarAvaliacao.onclick = async () => {
                    const avaliacao = {
                        email: emailUsuario, // <- MUITO IMPORTANTE PARA A PLANILHA
                        calosidade: document.getElementById("avalCalosidade").value,
                        ulcera: document.getElementById("avalUlcera").value,
                        amputacao: document.getElementById("avalAmputacao").value,
                        localAmputacao: document.getElementById("avalLocalAmputacao").value,
                        risco: document.getElementById("avalRisco").value,
                        data: new Date().toLocaleDateString()
                    };

                    if (!emailUsuario) {
                        alert("Erro: E-mail do usuário não encontrado. Faça login novamente.");
                        return;
                    }

                    btnSalvarAvaliacao.innerText = "Salvando...";

                    // Salva na planilha via API
                    const resposta = await window.salvarAvaliacaoAPI(avaliacao);
                    
                    if(resposta.sucesso) {
                        // Salva no localStorage também para aparecer rápido no histórico
                        let historico = JSON.parse(localStorage.getItem("avaliacoes")) || [];
                        historico.push(avaliacao);
                        localStorage.setItem("avaliacoes", JSON.stringify(historico));
                        
                        alert("Avaliação salva com sucesso!");
                        
                        // Limpa os campos
                        document.getElementById("avalLocalAmputacao").value = "";
                    } else {
                        alert(resposta.mensagem);
                    }
                    
                    btnSalvarAvaliacao.innerText = "Salvar Avaliação";
                };
            }
        };
    }

    // ===============================
    // HISTÓRICO
    // ===============================
    const btnHistorico = document.getElementById("btnHistorico");
    if (btnHistorico) {
        btnHistorico.onclick = () => {
            // Puxa do localStorage
            const historico = JSON.parse(localStorage.getItem("avaliacoes")) || [];
            let html = `<h2>📊 Histórico de Avaliações</h2>`;

            if (historico.length === 0) {
                html += "<p>Nenhuma avaliação encontrada neste dispositivo.</p>";
            } else {
                historico.forEach((item, index) => {
                    html += `
                        <div class="card" style="margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                            <p><b>Avaliação ${index + 1} (${item.data})</b></p>
                            <p>Calosidade: ${item.calosidade}</p>
                            <p>Úlcera: ${item.ulcera}</p>
                            <p>Amputação: ${item.amputacao} ${item.localAmputacao ? `(${item.localAmputacao})` : ''}</p>
                            <p>Risco: ${item.risco}</p>
                        </div>
                    `;
                });
            }

            document.getElementById("conteudo").innerHTML = html;
        };
    }

    // ===============================
    // SAIR
    // ===============================
    const btnSair = document.getElementById("btnSair");
    if (btnSair) {
        btnSair.onclick = () => {
            localStorage.clear();
            window.location = "login.html"; // Redireciona para o login
        };
    }

});
