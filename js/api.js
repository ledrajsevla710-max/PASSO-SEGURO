// ==========================================
// PASSO SEGURO - API
// Comunicação com Google Apps Script
// ==========================================

// URL da API publicada
const API_URL = "https://script.google.com/macros/s/AKfycbxiqXvtwk2n63j16cw6t6djePX6LNIkqfFFD2eJxGbEZ-YAWh1TgnluSgmtZlVGD-YR/exec";


// ==========================================
// Função genérica para enviar dados
// ==========================================

async function enviar(dados) {

    try {

        const resposta = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        });

        return await resposta.json();

    } catch (erro) {

        console.error(erro);

        return {

            sucesso: false,

            mensagem: "Erro de conexão com a API."

        };

    }

}


// ==========================================
// LOGIN
// ==========================================

async function login(email, senha) {

    return await enviar({

        acao: "login",

        email: email,

        senha: senha

    });

}


// ==========================================
// CADASTRO
// ==========================================

async function cadastrar(usuario) {

    return await enviar({

        acao: "cadastro",

        usuario: usuario

    });

}


// ==========================================
// ATUALIZAR PERFIL
// ==========================================

async function atualizarPerfil(usuario) {

    return await enviar({

        acao: "perfil",

        usuario: usuario

    });

}


// ==========================================
// SALVAR AVALIAÇÃO
// ==========================================

async function salvarAvaliacao(avaliacao) {

    return await enviar({

        acao: "avaliacao",

        avaliacao: avaliacao

    });

}


// ==========================================
// HISTÓRICO
// ==========================================

async function carregarHistorico(email) {

    return await enviar({

        acao: "historico",

        email: email

    });

}
