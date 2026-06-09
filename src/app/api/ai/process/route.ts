import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, context, existingData } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'O texto do comando é obrigatório.' }, { status: 400 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'Configuração da API de IA ausente.' }, { status: 500 });
    }

    let systemPrompt = '';

    if (context === 'departments') {
      systemPrompt = `Você é o assistente inteligente de inteligência artificial da Senda Consultoria. 
Sua tarefa é analisar o comando do usuário e transformá-lo em dados estruturados (JSON) para gerenciar o ORGANOGRAMA (departamentos/setores) da empresa.

Lista de departamentos/setores existentes atualmente:
${JSON.stringify(existingData || [])}

Retorne um objeto JSON com as seguintes chaves:
- "action": Ação a ser realizada. Valores possíveis: "create" (para criar), "update" (para atualizar), "delete" (para excluir), ou "unknown" (se não entender).
- "data": Objeto com os dados extraídos:
  - "name": Nome do departamento (ex: "Marketing", "Recursos Humanos").
  - "parent_id": UUID do departamento pai (se o usuário disser "abaixo de TI", procure o UUID de "TI" na lista de existentes). Retorne null se for um setor do topo da hierarquia ou se não for especificado.
  - "manager_name": Nome do responsável pelo setor (se o usuário disser "sob responsabilidade de Júlia", extraia "Júlia").
- "explanation": Uma breve explicação amigável em português do Brasil sobre o que você entendeu e o que será feito (ex: "Vou criar o departamento de Marketing sob o setor Comercial liderado por Júlia.").

Exemplo de saída esperada:
{
  "action": "create",
  "data": {
    "name": "Suporte Técnico",
    "parent_id": "some-uuid-of-ti",
    "manager_name": "João Silva"
  },
  "explanation": "Criando o setor de Suporte Técnico abaixo de TI, sob a responsabilidade de João Silva."
}`;
    } else if (context === 'indicators') {
      systemPrompt = `Você é o assistente inteligente de inteligência artificial da Senda Consultoria. 
Sua tarefa é analisar o comando do usuário e transformá-lo em dados estruturados (JSON) para gerenciar os INDICADORES estratégicos da empresa.

Lista de setores existentes:
${JSON.stringify(existingData?.departments || [])}

Retorne um objeto JSON com as seguintes chaves:
- "action": "create", "update", "delete" ou "unknown".
- "data": Objeto com os dados extraídos:
  - "name": Nome do indicador (ex: "Faturamento Mensal", "NPS", "Retenção de Talentos").
  - "department_id": UUID do setor a que este indicador pertence (procure nos setores existentes pelo nome mais próximo, ex: se disser "indicador de TI", busque o UUID de TI). Retorne null se não especificado.
  - "target": Valor da meta numérica (ex: 85, 150000, 10). Se for porcentagem, extraia apenas o número (ex: 85% vira 85).
  - "unit": Unidade da meta. Escolha uma das opções: "%", "R$", "qtd", "horas", "outros".
  - "year": Ano de vigência (se não especificado, use o ano atual).
- "explanation": Breve explicação em português do que será feito.

Exemplo de saída esperada:
{
  "action": "create",
  "data": {
    "name": "NPS (Satisfação do Cliente)",
    "department_id": "uuid-do-comercial",
    "target": 85,
    "unit": "%",
    "year": 2026
  },
  "explanation": "Criando o indicador 'NPS' para o setor Comercial com meta de 85% para o ano de 2026."
}`;
    } else if (context === 'action_plans') {
      systemPrompt = `Você é o assistente inteligente de inteligência artificial da Senda Consultoria. 
Sua tarefa é analisar o comando do usuário e transformá-lo em dados estruturados (JSON) para criar um PLANO DE AÇÃO (tarefa estratégica).

Contexto de setores e pessoas:
Setores: ${JSON.stringify(existingData?.departments || [])}
Membros da equipe: ${JSON.stringify(existingData?.profiles || [])}

Retorne um objeto JSON com as seguintes chaves:
- "action": "create", "update", "delete" ou "unknown".
- "data": Objeto com os dados extraídos:
  - "name": O título ou o que deve ser feito (ex: "Revisar contratos de vendas").
  - "description": Detalhes adicionais se houver.
  - "due_date": Prazo em formato de data YYYY-MM-DD. Se o usuário disser "até sexta-feira", "final do mês" ou "amanhã", calcule a data com base na data atual: ${new Date().toISOString().split('T')[0]} (hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}).
  - "responsible_id": UUID da pessoa responsável por executar a tarefa (procure na lista de perfis pelo nome mais próximo). Retorne null se não encontrar.
  - "approver_id": UUID da pessoa que vai aprovar a tarefa (ex: "com aprovação de Solano", procure Solano na lista). Retorne null se não encontrar.
  - "department_id": UUID do setor vinculado à tarefa. Retorne null se não especificado.
- "explanation": Breve explicação em português do que será feito.

Exemplo de saída esperada:
{
  "action": "create",
  "data": {
    "name": "Revisar Contratos de Vendas",
    "description": "Revisão geral das cláusulas comerciais",
    "due_date": "2026-06-30",
    "responsible_id": "uuid-do-fabricio",
    "approver_id": "uuid-do-solano",
    "department_id": "uuid-do-comercial"
  },
  "explanation": "Criando plano de ação 'Revisar Contratos de Vendas' para Fabricio executar até 30/06, com aprovação de Solano."
}`;
    } else if (context === 'meetings') {
      systemPrompt = `Você é o assistente inteligente de inteligência artificial da Senda Consultoria.
Sua tarefa é analisar o comando do usuário e transformá-lo em dados estruturados (JSON) para agendar uma REUNIÃO na agenda da empresa.

Contexto de setores e pessoas:
Setores: ${JSON.stringify(existingData?.departments || [])}
Membros da equipe: ${JSON.stringify(existingData?.profiles || [])}

Retorne um objeto JSON com as seguintes chaves:
- "action": "create", "update", "delete" ou "unknown".
- "data": Objeto com os dados extraídos:
  - "title": Título da reunião (ex: "Alinhamento de Vendas", "Conselho Mensal").
  - "description": Pauta ou descrição breve.
  - "start_time": Data e hora de início no formato ISO (YYYY-MM-DDTHH:MM:SSZ ou com timezone). Se o usuário falar "amanhã às 14h", calcule a data a partir de hoje: ${new Date().toISOString().split('T')[0]} (hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}). Use o timezone local ou UTC.
  - "end_time": Data e hora de término formatada em ISO. Se não especificado, assuma 1 hora de duração.
  - "department_id": UUID do setor associado.
  - "participants": Array contendo os UUIDs dos perfis dos participantes mencionados no comando.
- "explanation": Breve explicação em português do que será feito.`;
    } else {
      return NextResponse.json({ error: 'Contexto de IA inválido.' }, { status: 400 });
    }

    // Chamada para o OpenRouter
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pillar.io',
        'X-Title': 'Metodo Senda Core',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Temperatura baixa para garantir formato rígido do JSON
      }),
    });

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error('Erro no OpenRouter:', errorText);
      return NextResponse.json({ error: 'Erro ao se comunicar com o motor de IA.' }, { status: 500 });
    }

    const aiData = await openRouterRes.json();
    const resultText = aiData.choices[0]?.message?.content;

    if (!resultText) {
      return NextResponse.json({ error: 'A IA retornou uma resposta vazia.' }, { status: 500 });
    }

    const resultJson = JSON.parse(resultText);
    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('Erro na rota /api/ai/process:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
