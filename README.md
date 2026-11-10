# Passo Seguro

**Tecnologia digital de apoio ao autocuidado e à continuidade do acompanhamento de pessoas com úlcera nos pés recentemente cicatrizada, em seguimento de estomaterapia no serviço público.**

---

## O que é o Passo Seguro

O Passo Seguro é um protótipo de aplicativo web desenvolvido no contexto de pesquisa acadêmica. Seu objetivo é apoiar a **inspeção regular dos pés**, o **registro de alterações**, a **orientação segura** e o **acionamento do serviço de saúde** por pessoas que se encontram na fase de remissão de úlcera nos pés.

A proposta **não** reside na alegação de funcionalidade inédita. Já existem soluções isoladas de educação, registro fotográfico, comunicação e acompanhamento de feridas ativas. O diferencial buscado está na **integração de um ciclo operacional completo** — inspecionar, identificar alterações, orientar conduta segura, registrar a resposta e manter a continuidade do acompanhamento — com linguagem acessível e adequação ao contexto do serviço público de estomaterapia.

> **Importante:** O Passo Seguro é ferramenta de apoio ao autocuidado. **Não substitui** avaliação, diagnóstico, tratamento ou acompanhamento realizados por profissionais de saúde.

---

## Público-alvo e momento do cuidado

- Pessoas com diabetes e histórico de úlcera nos pés **recentemente cicatrizada** (fase de remissão).
- Em seguimento em serviço público de estomaterapia.
- Possibilidade de uso assistido por cuidador autorizado.

---

## Funcionalidades da versão 1.0 (Essencial)

Conforme delimitação do projeto de pesquisa:

| Funcionalidade | Descrição |
|---|---|
| Perfil de remissão | Cadastro com antecedentes de úlcera/amputação, neuropatia, doença arterial periférica, deformidades e apoio disponível |
| Checklist de inspeção | Sequência guiada e ilustrada de inspeção dos pés |
| Registro de alteração | Localização, data e descrição da mudança observada |
| Fotografia opcional guiada | Captura com orientação de posição, iluminação e lateralidade |
| Histórico longitudinal | Linha do tempo de inspeções e registros |
| Orientações de ação | Mensagens curtas e claras sobre o que fazer e quando procurar o serviço |
| Lembretes configuráveis | Apoio à regularidade da inspeção |
| Aviso de limites | Indicação explícita de que o recurso não substitui avaliação profissional |

### Funcionalidades dependentes de pactuação local (preparadas, não ativas por padrão)

- Painel do profissional
- Canal bidirecional e recepção de alertas
- Modo cuidador com autorização formal
- Integração de encaminhamentos

### Fora do escopo da versão 1.0

- Termografia
- Análise automática de imagem / inteligência artificial
- Mensuração automática de lesão
- Cálculo de probabilidade individual de recidiva
- Sensores ou dispositivos externos

---

## Ciclo operacional proposto

1. **Inspecionar** os pés (checklist ilustrado)
2. **Registrar** alteração (localização + data + descrição + foto opcional)
3. **Receber orientação** segura e clara
4. **Informar** se a orientação foi seguida
5. **Acessar canal** de contato com o serviço (quando pactuado)
6. **Registrar** o desfecho e manter o histórico

---

## Tecnologias

- **Front-end:** HTML5, CSS3, JavaScript (vanilla)
- **Backend / Auth / Banco / Storage:** [Supabase](https://supabase.com)
- **Hospedagem sugerida:** Vercel ou Netlify (gratuita)

---

## Estrutura do projeto
