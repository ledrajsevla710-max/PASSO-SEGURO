// js/config.js
// Configurações Globais e Conexão com o Supabase

const SUPABASE_URL = "https://gfavissgogrkhgsrrfey.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1MQ_vcYAdYYuyvqTUeG0jw_PsycjH80";

// Inicializa o cliente Supabase e expõe globalmente para o frontend
if (typeof supabase !== 'undefined' && supabase.createClient) {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase conectado e inicializado com sucesso!");
} else {
    console.error("Erro: A biblioteca do Supabase não foi carregada no HTML antes do config.js.");
}
