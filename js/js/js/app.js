ocument.addEventListener("DOMContentLoaded", () => {

const usuario = localStorage.getItem("usuario");

const nomeUsuario = document.getElementById("nomeUsuario");

if(usuario && nomeUsuario){
    nomeUsuario.innerText = "Olá, " + usuario;
}


// BOTÃO INÍCIO
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



// BOTÃO PERFIL
const btnPerfil = document.getElementById("btnPerfil");

if(btnPerfil){

btnPerfil.onclick = () => {

document.getElementById("conteudo").innerHTML = `

<h2>👤 Perfil do Paciente</h2>

<p>Área de cadastro do usuário.</p>

`;

};

}



// BOTÃO AVALIAÇÃO
const btnAvaliacao = document.getElementById("btnAvaliacao");

if(btnAvaliacao){

btnAvaliacao.onclick = () => {

document.getElementById("conteudo").innerHTML = `

<h2>🩺 Avaliação dos Pés</h2>

<p>Área onde será feita a avaliação de risco.</p>

`;

};

}



// BOTÃO HISTÓRICO
const btnHistorico = document.getElementById("btnHistorico");

if(btnHistorico){

btnHistorico.onclick = () => {

document.getElementById("conteudo").innerHTML = `

<h2>📊 Histórico</h2>

<p>Aqui aparecerão as avaliações salvas.</p>

`;

};

}



// SAIR
const btnSair = document.getElementById("btnSair");

if(btnSair){

btnSair.onclick = () => {

localStorage.clear();

window.location="login.html";

};

}


});
