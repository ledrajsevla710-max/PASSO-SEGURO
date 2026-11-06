// js/api.js
// Camada de Serviços para Consulta de Dados no Supabase

const ApiService = {
    // Busca o histórico de inspeções do paciente logado
    async obterHistoricoInspecoes(pacienteId) {
        try {
            const { data, error } = await supabaseClient
                .from('inspecoes_pes')
                .select('*')
                .eq('paciente_id', pacienteId)
                .order('data_inspecao', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Erro ao carregar histórico de inspeções:", error.message);
            return [];
        }
    },

    // Busca os dados clínicos de remissão do paciente
    async obterHistoricoRemissao(pacienteId) {
        try {
            const { data, error } = await supabaseClient
                .from('historico_pacientes')
                .select('*')
                .eq('paciente_id', pacienteId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            console.error("Erro ao carregar histórico de remissão:", error.message);
            return null;
        }
    }
};
