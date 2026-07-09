function login(){

    let email =
    document.getElementById("email").value;


    let senha =
    document.getElementById("senha").value;



    if(email === "" || senha === ""){

        alert("Preencha todos os campos");

        return;

    }


    /*
    Aqui futuramente entraremos
    com Firebase/Supabase.

    Por enquanto vamos apenas
    testar a navegação.
    */


    localStorage.setItem(
        "usuario",
        email
    );


    window.location.href="home.html";

}

