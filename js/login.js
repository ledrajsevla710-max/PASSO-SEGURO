async function login() {
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;

    if(email === "" || senha === ""){
        alert("Preencha todos os campos");
        return;
    }

    // Altera o texto do botão para dar feedback visual ao usuário
    let btnLogin = document.getElementById("btnLogin"); // Ajuste o ID se necessário
    if(btnLogin) btnLogin.innerText = "Entrando...";

    try {
        // Envia os dados para a sua API no Google Apps Script
        // Assumindo que a função genérica 'enviar' do seu api.js está disponível
        const resposta = await window.enviar({
            acao: "login",
            email: email,
            senha: senha
        });

        if (resposta.sucesso) {
            // O login deu certo! O back-end devolveu o objeto "usuario"
            // Vamos salvar cada dado separadamente no localStorage
            localStorage.setItem("nome", resposta.usuario.nome);
            localStorage.setItem("email", resposta.usuario.email);
            localStorage.setItem("telefone", resposta.usuario.telefone);
            localStorage.setItem("nascimento", resposta.usuario.nascimento);
            localStorage.setItem("cidade", resposta.usuario.cidade);
            localStorage.setItem("uf", resposta.usuario.uf);

            // Redireciona para o dashboard com os dados já carregados
            window.location.href = "dashboard.html";
        } else {
            // Se a senha estiver errada ou e-mail não existir
            alert(resposta.mensagem); 
            if(btnLogin) btnLogin.innerText = "Entrar";
        }

    } catch (erro) {
        console.error("Erro na comunicação de login:", erro);
        alert("Erro ao conectar com o servidor. Tente novamente.");
        if(btnLogin) btnLogin.innerText = "Entrar";
    }
}
