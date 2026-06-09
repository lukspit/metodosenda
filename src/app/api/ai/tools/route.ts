import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { tool, payload } = await req.json();

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'Configuração da API de IA ausente no servidor.' }, { status: 500 });
    }

    let systemPrompt = '';
    let userMessage = '';

    // Mapeamento do prompt sistêmico com base na ferramenta selecionada
    if (tool === 'reviewer') {
      const { documentText, documentType, tenantInfo } = payload;
      const companyName = tenantInfo?.name || 'nossa empresa';
      const companySector = tenantInfo?.sector || 'Geral';

      systemPrompt = `Você é o consultor jurídico-estratégico sênior da Senda Consultoria.
Sua tarefa é analisar criticamente um documento do tipo "${documentType}" sob a perspectiva de proteger e trazer vantagem estratégica para a empresa "${companyName}" (atuante no setor de ${companySector}).

Instruções Importantes de Formatação e Estilo:
1. Comece DIRETAMENTE com a análise. É PROIBIDO qualquer tipo de saudação inicial ou conversa fiada.
2. É PROIBIDO qualquer tipo de assinatura ou despedida no final. O texto deve acabar logo após o último ponto de forma natural.
3. Seja cirúrgico, extremamente claro e focado em pontos práticos.
4. Formate a resposta usando Markdown limpo com a seguinte estrutura:
   - Use títulos H2 (##) para as seções principais:
     ## 1. Cláusulas de Alto Risco / Pontos de Atenção (Liste em detalhes os riscos operacionais, financeiros ou jurídicos e explique o porquê do risco).
     ## 2. Sugestões de Redação e Melhoria (Forneça redações alternativas exatas e profissionais para substituir os trechos arriscados, visando defender a "${companyName}").
     ## 3. Parecer Estratégico Senda (Uma avaliação geral e sintética sobre assinar, negociar ou recusar o documento).
   - Use listas estruturadas com marcadores (* ou -).
   - Use negritos (**destaque**) de forma estratégica para palavras-chave e valores.
   - Use formatação de bloco de código (\`\`\`) para as sugestões de novos textos contratuais.`;

      userMessage = `Aqui está o texto do documento para análise:
      
${documentText}`;

    } else if (tool === 'generator') {
      const { templateType, partiesInfo, tenantInfo } = payload;
      const companyName = tenantInfo?.name || 'CONTRATANTE';
      const companyPurpose = tenantInfo?.purpose || '';
      
      systemPrompt = `Você é o consultor jurídico-corporativo sênior da Senda Consultoria.
Sua tarefa é redigir uma minuta de contrato completa, robusta e formal do tipo "${templateType}" sob medida para a empresa "${companyName}" figurar como a parte principal (proteger seus direitos, prazos e garantias).

Instruções Importantes de Formatação e Estilo:
1. Comece DIRETAMENTE com o título do documento em Markdown H2 (##). É PROIBIDO qualquer tipo de introdução ou saudação.
2. É PROIBIDO qualquer tipo de assinatura ou fechamento informal. O contrato deve terminar com o bloco padrão de assinaturas: "E por estarem justos e contratados, assinam o presente..."
3. Use linguagem jurídica extremamente técnica, clara, formal e profissional (língua portuguesa formal do Brasil).
4. Organize em cláusulas estruturadas com títulos H3 (### Cláusula Primeira - Objeto, ### Cláusula Segunda - Preço e Condições, etc.).
5. Deixe campos dinâmicos preenchidos com os dados fornecidos ou indicados por colchetes [como dados de testemunhas, etc.].
6. Você DEVE incluir cláusulas dedicadas e personalizadas caso os seguintes parâmetros opcionais sejam informados nos "Dados para inserção" abaixo:
   - "jurisdictionForo" (Foro de Eleição para resolução de disputas judiciais).
   - "terminationPenalty" (Penalidade/multa por rescisão contratual imotivada ou quebra de deveres).
   - "intellectualProperty" (Propriedade intelectual de entregáveis: se do Contratante, Contratado ou Compartilhada).
   - "exclusivityTerms" (Exclusividade comercial durante a prestação).

Dados para inserção:
${JSON.stringify(partiesInfo || {})}`;

      userMessage = `Gere a minuta de "${templateType}" completa e profissional de acordo com as especificações e dados passados.`;

    } else if (tool === 'financial_analysis') {
      const { 
        fixedCosts, 
        contributionMargin, 
        revenue, 
        breakEvenPoint, 
        marginOfSafety, 
        sector, 
        simulMode,
        fixedCostsDetail,
        marginDetail,
        tenantInfo 
      } = payload;
      
      const companyName = tenantInfo?.name || 'empresa';

      let detailsContext = '';
      if (simulMode === 'detailed') {
        detailsContext = `
Detalhamento de Custos Fixos Cadastrados pelo Usuário:
- Salários & Pró-labore: R$ ${fixedCostsDetail?.salaries || 0}
- Aluguel & Contas fixas: R$ ${fixedCostsDetail?.rent || 0}
- Licenças & Softwares: R$ ${fixedCostsDetail?.software || 0}
- Outras despesas de operação: R$ ${fixedCostsDetail?.operational || 0}

Detalhamento da Margem de Contribuição Calculada:
- Preço Médio cobrado: R$ ${marginDetail?.unitPrice || 0}
- Imposto sobre vendas: ${marginDetail?.taxPercent || 0}%
- Comissões sobre vendas: ${marginDetail?.commissionPercent || 0}%
- Custos Diretos Unitários de Entrega/CMV: R$ ${marginDetail?.directUnitCost || 0}
`;
      }

      systemPrompt = `Você é o consultor de finanças corporativas sênior da Senda Consultoria.
Sua tarefa é analisar os resultados obtidos do cálculo do Ponto de Equilíbrio (Break-Even) da empresa "${companyName}" (setor: ${sector}) e emitir um parecer consultivo estratégico detalhado.

Dados Financeiros Gerais Fornecidos:
- Custos Fixos Mensais Totais: R$ ${fixedCosts.toLocaleString('pt-BR')}
- Margem de Contribuição Média: ${contributionMargin}%
- Faturamento Mensal Atual: R$ ${revenue.toLocaleString('pt-BR')}
- Ponto de Equilíbrio (Break-Even): R$ ${breakEvenPoint.toLocaleString('pt-BR')}
- Margem de Segurança: ${marginOfSafety}% (${marginOfSafety >= 20 ? 'Excelente' : marginOfSafety > 0 ? 'Atenção / Apertada' : 'Crítica / Operando em Prejuízo'})
${detailsContext}

Instruções Importantes de Formatação e Estilo:
1. Comece DIRETAMENTE com o parecer. É PROIBIDO qualquer introdução, saudação inicial ou despedida formal.
2. Seja prático, direto e com foco em finanças corporativas reais. 
3. Se o preenchimento detalhado foi fornecido, comente especificamente sobre a proporção dos custos fixos (ex: se salários/pró-labore representam um peso excessivo na operação) ou sobre a composição da margem de contribuição (se está sofrendo pressão por tributos altos ou CMV elevado) e ofereça soluções de ganho de margem.
4. Formate usando Markdown com a seguinte estrutura:
   - ## Análise de Saúde Financeira (Exposição do status operacional, segurança de caixa e do faturamento atual contra o ponto de equilíbrio).
   - ## 3 Recomendações de Ação Imediata (Ações específicas e práticas de precificação, controle de gastos fixos ou táticas comerciais para o setor de ${sector}).
   - Use listas de marcadores para as recomendações.
   - Use negrito (**destaque**) de forma útil.`;

      userMessage = `Gere o parecer de saúde financeira e recomendações estratégicas com base nos números e desdobramentos fornecidos.`;
    } else {
      return NextResponse.json({ error: 'Ferramenta utilitária inválida.' }, { status: 400 });
    }

    // Chamada à API da OpenRouter
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
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error('Erro na chamada da API da IA (OpenRouter):', errorText);
      return NextResponse.json({ error: 'Erro de comunicação com o servidor de IA.' }, { status: 500 });
    }

    const aiData = await openRouterRes.json();
    const resultText = aiData.choices[0]?.message?.content;

    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error('Erro na rota /api/ai/tools:', error);
    return NextResponse.json({ error: error.message || 'Erro de processamento interno.' }, { status: 500 });
  }
}
