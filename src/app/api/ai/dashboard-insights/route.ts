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

Seja direto, profissional, encorajador e prático. Use português do Brasil.
A resposta deve ser formatada em HTML leve ou Markdown limpo para renderização (use títulos pequenos, negritos e listas).

Analise criticamente:
1. Quais planos de ação estão atrasados e quem é o responsável, alertando sobre o risco.
2. Quais indicadores estão abaixo da meta e como isso se relaciona com os planos de ação.
3. Sugira uma ou duas ações corretivas urgentes que o gestor deve tomar hoje.

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
