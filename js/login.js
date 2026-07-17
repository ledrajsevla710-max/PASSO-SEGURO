// ==========================================
// PASSO SEGURO
// LOGIN, CADASTRO E RECUPERAÇÃO
// ==========================================


document.addEventListener("DOMContentLoaded", () => {



    // ==========================================
    // PASSO SEGURO
    // LOGIN
    // ==========================================


    const btnLogin = document.getElementById("btnLogin");


    if(btnLogin){


        btnLogin.onclick = async () => {



            const email =
            document.getElementById("email")
            .value
            .trim();



            const senha =
            document.getElementById("senha")
            .value
            .trim();



            if(!email || !senha){


                alert(
                    "Preencha e-mail e senha."
                );


                return;


            }



            const resposta =
            await login(
                email,
                senha
            );



            if(resposta.sucesso){



                localStorage.setItem(

                    "usuario",

                    JSON.stringify(
                        resposta.usuario
                    )

                );



                window.location =
                "dashboard.html";



            }else{


                alert(
                    resposta.mensagem
                );


            }


        };


    }





    // ==========================================
    // PASSO SEGURO
    // CADASTRO DE USUÁRIO
    // ==========================================


    const btnCadastro =
    document.getElementById("btnCadastro");



    if(btnCadastro){



        btnCadastro.onclick =
        async () => {



            const usuario = {



                nome:
                document.getElementById("nome")
                .value
                .trim(),



                email:
                document.getElementById("email")
                .value
                .trim(),



                senha:
                document.getElementById("senha")
                .value
                .trim(),



                telefone:
                document.getElementById("telefone")
                .value
                .trim(),



                nascimento:
                document.getElementById("nascimento")
                .value,



                cidade:
                document.getElementById("cidade")
                .value
                .trim(),



                uf:
                document.getElementById("uf")
                .value



            };




            if(
                !usuario.nome ||
                !usuario.email ||
                !usuario.senha
            ){


                alert(
                    "Preencha nome, e-mail e senha."
                );


                return;


            }




            const resposta =
            await cadastrar(usuario);




            alert(
                resposta.mensagem
            );




            if(resposta.sucesso){


                window.location =
                "login.html";


            }



        };


    }





    // ==========================================
    // PASSO SEGURO
    // RECUPERAR SENHA / SUPORTE
    // ==========================================


    const btnRecuperar =
    document.getElementById("btnRecuperar");



    if(btnRecuperar){



        btnRecuperar.onclick =
        async () => {



            const email =
            document.getElementById("email")
            .value
            .trim();



            if(!email){


                alert(
                    "Digite seu e-mail cadastrado."
                );


                return;


            }




            const resposta =
            await recuperarSenha(email);




            if(resposta.sucesso){


                alert(

                    resposta.mensagem +
                    "\n\nSuporte: " +
                    resposta.suporte

                );



            }else{


                alert(
                    resposta.mensagem
                );


            }



        };


    }



});
