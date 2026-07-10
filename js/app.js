document.addEventListener("DOMContentLoaded", () => {

    // 1. CARREGAR DADOS DO USUÁRIO LOGADO
    // Esses dados devem ter sido salvos no localStorage no momento do Login
    const usuarioAtual = {
        nome: localStorage.getItem("nome"),
        email: localStorage.getItem("email"),
        telefone: localStorage.getItem("telefone"),
        nascimento: localStorage.getItem("nascimento"),
        cidade: localStorage.getItem("cidade"),
        uf: localStorage.getItem("uf")
    };

    const nomeUsuarioUI = document.getElementById("nomeUsuario");
    if (usuarioAtual.nome && nomeUsuarioUI) {
        nomeUsuarioUI.innerText = "Olá, " + usuarioAtual.nome;
    }

    // Função auxiliar para calcular a idade
    function calcularIdade(dataNascimento) {
        if(!dataNascimento) return "Não informada";
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    }

    // ===============================
    // PERFIL
    // ===============================
    const btnPerfil = document.getElementById("btnPerfil");
    if (btnPerfil) {
        btnPerfil.onclick = () => {
            document.getElementById("conteudo").innerHTML = `
                <h2>👤 Meu Perfil</h2>
                <div class="card">
                    <label>Nome</label>
                    <input type="text" id="perfilNome" value="${usuarioAtual.nome || ''}">
                    
                    <label>E-mail (Não editável)</label>
                    <input type="email" id="perfilEmail" value="${usuarioAtual.email || ''}" readonly style="background-color: #f0f0f0;">
                    
                    <label>Telefone</label>
                    <input type="text" id="perfilTelefone" value="${usuarioAtual.telefone || ''}">
                    
                    <label>Data de nascimento</label>
                    <input type="date" id="perfilNascimento" value="${usuarioAtual.nascimento || ''}">
                    
                    <label>Cidade</label>
                    <input type="text" id="perfilCidade" value="${usuarioAtual.cidade || ''}">
                    
                    <label>Estado</label>
                    <select id="perfilUf">
                        <option value="PI" ${usuarioAtual.uf === 'PI' ? 'selected' : ''}>PI</option>
                        <option value="MA" ${usuarioAtual.uf === 'MA' ? 'selected' : ''}>MA</option>
                        <option value="CE" ${usuarioAtual.uf === 'CE' ? 'selected' : ''}>CE</option>
                        <option value="BA" ${usuarioAtual.uf === 'BA' ? 'selected' : ''}>BA</option>
                        <option value="PE" ${usuarioAtual.uf === 'PE' ? 'selected' : ''}>PE</option>
                    </select>
                    
                    <button id="salvarPerfil">Salvar Alterações</button>
                </div>
            `;

            const btnSalvarPerfil = document.getElementById("salvarPerfil");
            if (btnSalvarPerfil) {
                btnSalvarPerfil.onclick = async () => {
                    const perfilAtualizado = {
                        nome: document.getElementById("perfilNome").value,
                        email: document.getElementById("perfilEmail").value, 
                        telefone: document.getElementById("perfilTelefone").value,
                        nascimento: document.getElementById("perfilNascimento").value,
                        cidade: document.getElementById("perfilCidade").value,
                        uf: document.getElementById("perfilUf").value
                    };

                    btnSalvarPerfil.innerText = "Salvando...";
                    
                    // Supondo que window.atualizarPerfil está no seu api.js
                    const resposta = await window.atualizarPerfil(perfilAtualizado);

                    if(resposta.sucesso) {
                        // Atualiza o localStorage com os novos dados
                        localStorage.setItem("nome", perfilAtualizado.nome);
                        localStorage.setItem("telefone", perfilAtualizado.telefone);
                        localStorage.setItem("nascimento", perfilAtualizado.nascimento);
                        localStorage.setItem("cidade", perfilAtualizado.cidade);
                        localStorage.setItem("uf", perfilAtualizado.uf);
                        
                        // Atualiza a saudação no topo
                        if(nomeUsuarioUI) nomeUsuarioUI.innerText = "Olá, " + perfilAtualizado.nome;
                        alert("Perfil atualizado com sucesso!");
                    } else {
                        alert(resposta.mensagem);
                    }
                    btnSalvarPerfil.innerText = "Salvar Alterações";
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
            // A tela agora só pergunta dados clínicos
            document.getElementById("conteudo").innerHTML = `
                <h2>🩺 Nova Avaliação</h2>
                <div class="card">
                    <p style="font-size: 0.9em; color: #555;">Paciente: <b>${usuarioAtual.nome}</b></p>
                    <hr style="margin-bottom: 15px; border: 0; border-top: 1px solid #eee;">

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
                    
                    const idadeCalculada = calcularIdade(usuarioAtual.nascimento);

                    // Objeto híbrido: mescla dados clínicos da tela com dados demográficos ocultos do paciente
                    const avaliacao = {
                        email: usuarioAtual.email, 
                        nome: usuarioAtual.nome,
                        idade: idadeCalculada,
                        cidade: usuarioAtual.cidade,
                        calosidade: document.getElementById("avalCalosidade").value,
                        ulcera: document.getElementById("avalUlcera").value,
                        amputacao: document.getElementById("avalAmputacao").value,
                        localAmputacao: document.getElementById("avalLocalAmputacao").value,
                        risco: document.getElementById("avalRisco").value,
                        data: new Date().toLocaleDateString()
                    };

                    btnSalvarAvaliacao.innerText = "Salvando...";

                    const resposta = await window.salvarAvaliacaoAPI(avaliacao);
                    
                    if(resposta.sucesso) {
                        alert("Avaliação registrada com sucesso!");
                        document.getElementById("avalLocalAmputacao").value = "";
                        document.getElementById("avalCalosidade").value = "Não";
                        document.getElementById("avalUlcera").value = "Não";
                        document.getElementById("avalAmputacao").value = "Não";
                        document.getElementById("avalRisco").value = "Baixo";
                    } else {
                        alert(resposta.mensagem);
                    }
                    
                    btnSalvarAvaliacao.innerText = "Salvar Avaliação";
                };
            }
        };
    }

    // ===============================
    // SAIR
    // ===============================
    const btnSair = document.getElementById("btnSair");
    if (btnSair) {
        btnSair.onclick = () => {
            localStorage.clear();
            window.location = "login.html"; 
        };
    }

});
