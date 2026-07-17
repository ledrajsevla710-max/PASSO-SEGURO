// ==========================================
// PASSO SEGURO
// API
// Comunicação com Google Apps Script
// ==========================================



// ==========================================
// PASSO SEGURO
// ENVIAR DADOS PARA API
// ==========================================

async function enviar(dados) {


    try {


        const resposta = await fetch(API_URL, {

    method:"POST",

    headers:{

        "Content-Type":"text/plain"

    },

    body:JSON.stringify(dados)

});



        return await resposta.json();



    } catch(erro){



        console.error(
            "Erro na API:",
            erro
        );



        return {


            sucesso:false,


            mensagem:"Erro de conexão com o servidor."


        };



    }



}



// ==========================================
// PASSO SEGURO
// LOGIN
// ==========================================

async function login(email, senha){



    return await enviar({



        acao:"login",



        email:email,



        senha:senha



    });



}



// ==========================================
// PASSO SEGURO
// CADASTRO DE USUÁRIO
// ==========================================

async function cadastrar(usuario){



    return await enviar({



        acao:"cadastro",



        usuario:usuario



    });



}



// ==========================================
// PASSO SEGURO
// ATUALIZAR PERFIL
// ==========================================

async function atualizarPerfil(usuario){



    return await enviar({



        acao:"perfil",



        usuario:usuario



    });



}



// ==========================================
// PASSO SEGURO
// SALVAR AVALIAÇÃO
// ==========================================

async function salvarAvaliacao(avaliacao){



    return await enviar({



        acao:"avaliacao",



        avaliacao:avaliacao



    });



}



// ==========================================
// PASSO SEGURO
// BUSCAR HISTÓRICO
// ==========================================

async function carregarHistorico(email){



    return await enviar({



        acao:"historico",



        email:email



    });



}



// ==========================================
// PASSO SEGURO
// RECUPERAR SENHA / SUPORTE
// ==========================================

async function recuperarSenha(email){



    return await enviar({



        acao:"recuperarSenha",



        email:email



    });



}
