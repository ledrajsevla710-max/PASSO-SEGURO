document.addEventListener("DOMContentLoaded", () => {

const usuario = localStorage.getItem("usuario");

const nomeUsuario = document.getElementById("nomeUsuario");

if(usuario && nomeUsuario){
    nomeUsuario.innerText = "Olá, " + usuario;
}


// ===============================
// INÍCIO
// ===============================

const btnHome = document.getElementById("btnHome");

if(btnHome){

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

if(btnPerfil){

btnPerfil.onclick = () => {

document.getElementById("conteudo").innerHTML = `

<h2>👤 Perfil do Paciente</h2>

<div class="card">

<label>Nome</label>
<input type="text" id="perfilNome">

<label>E-mail</label>
<input type="email" id="perfilEmail">

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

<button id="salvarPerfil">
Salvar Perfil
</button>

</div>

`;


const salvarPerfil = document.getElementById("salvarPerfil");


if(salvarPerfil){

salvarPerfil.onclick = async () => {


const perfil = {

nome: document.getElementById("perfilNome").value,

email: document.getElementById("perfilEmail").value,

telefone: document.getElementById("perfilTelefone").value,

nascimento: document.getElementById("perfilNascimento").value,

cidade: document.getElementById("perfilCidade").value,

uf: document.getElementById("perfilUf").value

};



const resposta = await window.atualizarPerfil(perfil);



if(resposta.sucesso){

alert(resposta.mensagem);

}else{

alert(resposta.mensagem);

}


};


// ===============================
// AVALIAÇÃO
// ===============================

const btnAvaliacao = document.getElementById("btnAvaliacao");


if(btnAvaliacao){

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

<input type="text" id="avalLocalAmputacao">



<label>Nível de risco</label>

<select id="avalRisco">

<option>Baixo</option>
<option>Moderado</option>
<option>Alto</option>

</select>



<button id="salvarAvaliacao">

Salvar Avaliação

</button>


</div>

`;



const salvarAvaliacao = document.getElementById("salvarAvaliacao");


if(salvarAvaliacao){

salvarAvaliacao.onclick = () => {


const avaliacao = {

calosidade:
document.getElementById("avalCalosidade").value,

ulcera:
document.getElementById("avalUlcera").value,

amputacao:
document.getElementById("avalAmputacao").value,

localAmputacao:
document.getElementById("avalLocalAmputacao").value,

risco:
document.getElementById("avalRisco").value,

data:
new Date().toLocaleDateString()

};


let historico =
JSON.parse(localStorage.getItem("avaliacoes")) || [];


historico.push(avaliacao);


localStorage.setItem(
"avaliacoes",
JSON.stringify(historico)
);


alert("Avaliação salva com sucesso!");

};

}

};

}



// ===============================
// HISTÓRICO
// ===============================

const btnHistorico = document.getElementById("btnHistorico");


if(btnHistorico){

btnHistorico.onclick = () => {


const historico =
JSON.parse(localStorage.getItem("avaliacoes")) || [];


let html = `

<h2>📊 Histórico</h2>

`;


if(historico.length === 0){

html += "<p>Nenhuma avaliação encontrada.</p>";

}else{


historico.forEach((item,index)=>{

html += `

<div class="card">

<p><b>Avaliação ${index + 1}</b></p>

<p>Calosidade: ${item.calosidade}</p>

<p>Úlcera: ${item.ulcera}</p>

<p>Amputação: ${item.amputacao}</p>

<p>Risco: ${item.risco}</p>

<p>Data: ${item.data}</p>

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

if(btnSair){

    btnSair.onclick = () => {

        localStorage.clear();

        window.location = "login.html";

    };

}

};
