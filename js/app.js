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

    document.getElementById("conteudo").innerHTML = `

        <h2>👤 Perfil do Paciente</h2>

        <div class="card">

            <label>Nome</label>
            <input
                type="text"
                id="perfilNome"
                value="${usuario.nome || ""}">

            <label>E-mail</label>
            <input
                type="email"
                id="perfilEmail"
                value="${usuario.email || ""}"
                readonly>

            <label>Telefone</label>
            <input
                type="text"
                id="perfilTelefone"
                value="${usuario.telefone || ""}">

            <label>Data de Nascimento</label>
            <input
                type="date"
                id="perfilNascimento"
                value="${usuario.nascimento || ""}">

            <label>Cidade</label>
            <input
                type="text"
                id="perfilCidade"
                value="${usuario.cidade || ""}">

            <label>Estado</label>

            <select id="perfilUf">

                <option value="PI">PI</option>
                <option value="MA">MA</option>
                <option value="CE">CE</option>
                <option value="BA">BA</option>
                <option value="PE">PE</option>

            </select>

            <br><br>

            <button id="salvarPerfil">
                Salvar Perfil
            </button>

        </div>

    `;

    document.getElementById("perfilUf").value = usuario.uf || "PI";

    document.getElementById("salvarPerfil").onclick = async function () {

        usuario.nome = document.getElementById("perfilNome").value;

        usuario.telefone = document.getElementById("perfilTelefone").value;

        usuario.nascimento = document.getElementById("perfilNascimento").value;

        usuario.cidade = document.getElementById("perfilCidade").value;

        usuario.uf = document.getElementById("perfilUf").value;

        const resposta = await atualizarPerfil(usuario);

      if (resposta.sucesso) {


    localStorage.setItem(

        "usuario",

        JSON.stringify(usuario)

    );


    alert(
        "Perfil atualizado com sucesso!"
    );


    carregarUsuario();


}  else {

            alert(resposta.mensagem);

        }

    };

}


// ==========================================
// PASSO SEGURO
// AVALIAÇÃO
// ==========================================

function abrirAvaliacao() {

    const idade = calcularIdade(usuario.nascimento);

    document.getElementById("conteudo").innerHTML = `

        <h2>🩺 Avaliação dos Pés</h2>

        <div class="card">

            <p><b>Paciente:</b> ${usuario.nome}</p>

            <p><b>Idade:</b> ${idade} anos</p>

            <p><b>Cidade:</b> ${usuario.cidade} - ${usuario.uf}</p>

            <hr>

            <label>Possui calosidade?</label>

            <select id="avalCalosidade">

                <option value="Não">Não</option>
                <option value="Sim">Sim</option>

            </select>

            <label>Possui úlcera?</label>

            <select id="avalUlcera">

                <option value="Não">Não</option>
                <option value="Sim">Sim</option>

            </select>

            <label>Já realizou amputação?</label>

            <select id="avalAmputacao">

                <option value="Não">Não</option>
                <option value="Sim">Sim</option>

            </select>

            <label>Local da amputação</label>

            <input
                type="text"
                id="avalLocalAmputacao"
                placeholder="Informe o local">

            <label>Nível de risco</label>

            <select id="avalRisco">

                <option value="Baixo">Baixo</option>
                <option value="Moderado">Moderado</option>
                <option value="Alto">Alto</option>

            </select>

            <br><br>

            <button id="salvarAvaliacao">

                Salvar Avaliação

            </button>

        </div>

    `;

    document.getElementById("salvarAvaliacao").onclick = async function () {

        const avaliacao = {

            nome: usuario.nome,

            email: usuario.email,

            idade: idade,

            cidade: usuario.cidade,

            uf: usuario.uf,

            telefone: usuario.telefone,

            nascimento: usuario.nascimento,

            calosidade: document.getElementById("avalCalosidade").value,

            ulcera: document.getElementById("avalUlcera").value,

            amputacao: document.getElementById("avalAmputacao").value,

            localAmputacao: document.getElementById("avalLocalAmputacao").value,

            risco: document.getElementById("avalRisco").value

        };

        const resposta = await salvarAvaliacao(avaliacao);

        if (resposta.sucesso) {

            alert("Avaliação salva com sucesso!");

        } else {

            alert(resposta.mensagem);

        }

    };

}


// ==========================================
// PASSO SEGURO
// HISTÓRICO
// ==========================================

function abrirHistorico() {

    document.getElementById("conteudo").innerHTML = `

        <h2>📊 Histórico de Avaliações</h2>

        <p>Carregando histórico...</p>

    `;

    carregarHistorico(usuario.email)

    .then(function(resposta){

        if(!resposta.sucesso){

            document.getElementById("conteudo").innerHTML = `

                <h2>📊 Histórico de Avaliações</h2>

                <p>${resposta.mensagem}</p>

            `;

            return;

        }

        let html = `

            <h2>📊 Histórico de Avaliações</h2>

        `;

        if(resposta.avaliacoes.length === 0){

            html += `

                <p>Nenhuma avaliação encontrada.</p>

            `;

        }else{

            resposta.avaliacoes.forEach(function(item, indice){

                html += `

                    <div class="card">

                        <h3>Avaliação ${indice + 1}</h3>

                        <p><b>Data:</b> ${item.data}</p>

                        <p><b>Calosidade:</b> ${item.calosidade}</p>

                        <p><b>Úlcera:</b> ${item.ulcera}</p>

                        <p><b>Amputação:</b> ${item.amputacao}</p>

                        <p><b>Local:</b> ${item.localAmputacao}</p>

                        <p><b>Risco:</b> ${item.risco}</p>

                    </div>

                `;

            });

        }

        document.getElementById("conteudo").innerHTML = html;

    });

}


// ==========================================
// PASSO SEGURO
// SAIR
// ==========================================

function sair() {

    if (confirm("Deseja realmente sair do sistema?")) {

        localStorage.clear();

        window.location.href = "login.html";

    }

}


// ==========================================
// PASSO SEGURO
// FUNÇÕES AUXILIARES
// ==========================================


function calcularIdade(dataNascimento) {

    if (!dataNascimento) {

        return "";

    }


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



function formatarData(data) {

    if (!data) {

        return "";

    }


    const dataFormatada = new Date(data);


    return dataFormatada.toLocaleDateString("pt-BR");

}
