import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { content, existingData } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'O conteúdo da ata é obrigatório.' }, { status: 400 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'Configuração da API de IA ausente.' }, { status: 500 });
    }

    const systemPrompt = `Você é o consultor de IA especialista da Senda Consultoria.
Sua missão é ler o texto de uma ATA DE REUNIÃO empresarial, resumir seus pontos críticos e extrair os PLANOS DE AÇÃO decididos na reunião.

Contexto da equipe e setores da empresa para ajudar na associação:
Setores: ${JSON.stringify(existingData?.departments || [])}
Membros da equipe: ${JSON.stringify(existingData?.profiles || [])}

Retorne um objeto JSON estrito com as seguintes chaves:
- "summary": Um resumo executivo elegante, formal e formatado em tópicos markdown das decisões e discussões da reunião.
- "action_plans": Uma lista (array) de planos de ação encontrados no texto. Cada item deve conter:
  - "name": O título ou o que deve ser feito (de forma clara e resumida, ex: "Contratar nova agência de tráfego").
  - "description": Explicação ou detalhes adicionais da ação decidida.
  - "due_date": Prazo sugerido em formato YYYY-MM-DD. Se na ata disser "até o fim do mês" ou "daqui a duas semanas", calcule a data baseado em hoje: ${new Date().toISOString().split('T')[0]}.
  - "responsible_id": UUID do responsável correspondente na equipe. Retorne null se não mencionado ou não encontrado na lista.
  - "approver_id": UUID do aprovador correspondente na equipe. Retorne null se não mencionado.
  - "department_id": UUID do setor correspondente. Retorne null se não mencionado.

Exemplo de formato de resposta:
{
  "summary": "### Pontos Discutidos\\n- Alinhamento sobre a queda nas vendas do trimestre...\\n- Decisão de reestruturar a equipe comercial.",
  "action_plans": [
    {
      "name": "Revisar Script de Vendas",
      "description": "Atualizar o roteiro de ligação com os novos benefícios do produto",
      "due_date": "2026-06-20",
      "responsible_id": "uuid-do-fabricio",
      "approver_id": "uuid-do-paulo",
      "department_id": "uuid-do-comercial"
    }
  ]
}`;

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
          { role: 'user', content: content },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error('Erro no OpenRouter:', errorText);
      return NextResponse.json({ error: 'Erro ao se comunicar com a IA.' }, { status: 500 });
    }

    const aiData = await openRouterRes.json();
    const resultText = aiData.choices[0]?.message?.content;

    if (!resultText) {
      return NextResponse.json({ error: 'A IA retornou uma resposta vazia.' }, { status: 500 });
    }

    const resultJson = JSON.parse(resultText);
    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('Erro na rota /api/ai/analyze-minutes:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
