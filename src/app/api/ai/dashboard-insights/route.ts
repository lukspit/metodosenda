import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { indicators, actionPlans, tenantName } = await req.json();

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'Configuração da API de IA ausente.' }, { status: 500 });
    }

    const systemPrompt = `Você é o consultor sênior da Senda Consultoria empresarial.
Sua tarefa é analisar os dados de desempenho (indicadores e planos de ação) da empresa cliente "${tenantName}" e gerar um diagnóstico executivo com insights acionáveis e recomendações de gestão estratégica.

Instruções Cruciais de Estilo e Formato:
1. Comece DIRETAMENTE com o diagnóstico. PROÍBA estritamente qualquer saudação inicial como "Prezados(as) Diretores(as)", saudações cordiais, introduções ou frases de cortesia típicas de e-mail.
2. PROÍBA estritamente qualquer assinatura de fechamento no final, como "Atenciosamente, consultor sênior", "Senda Consultoria", ou qualquer despedida formal. O texto deve terminar logo após o último insight/recomendação de forma natural.
3. Seja extremamente direto, analítico, focado e prático. Evite redundâncias, rodeios textuais ou floreios burocráticos.
4. Formate a resposta usando Markdown limpo com a seguinte estrutura:
   - Use títulos H2 (##) para seções principais (ex: ## 1. Análise de Planos de Ação, ## 2. Desempenho de Indicadores, ## 3. Ações Corretivas).
   - Use títulos H3 (###) para subseções se necessário.
   - Use listas com marcadores (* ou -) para organizar pontos de atenção ou listas de recomendações.
   - Use negritos (**destaque**) de forma estratégica para ressaltar dados numéricos, nomes de responsáveis, ou prazos limite.

Analise criticamente:
1. Planos de ação pendentes ou atrasados, indicando responsável e o risco associado.
2. Indicadores que estão abaixo da meta e o impacto disso nos planos.
3. Defina de 1 a 2 ações corretivas imediatas e práticas.

Dados fornecidos:
Indicadores: ${JSON.stringify(indicators || [])}
Planos de Ação: ${JSON.stringify(actionPlans || [])}`;

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
          { role: 'user', content: 'Gere o diagnóstico estratégico atual para a diretoria.' },
        ],
        temperature: 0.3,
      }),
    });

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error('Erro no OpenRouter:', errorText);
      return NextResponse.json({ error: 'Erro ao conectar à IA.' }, { status: 500 });
    }

    const aiData = await openRouterRes.json();
    const insightText = aiData.choices[0]?.message?.content;

    return NextResponse.json({ insight: insightText });

  } catch (error: any) {
    console.error('Erro na rota /api/ai/dashboard-insights:', error);
    return NextResponse.json({ error: error.message || 'Erro interno.' }, { status: 500 });
  }
}
