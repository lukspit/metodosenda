import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { fileData, filename, mimeType } = await req.json();

    if (!fileData) {
      return NextResponse.json({ error: 'O conteúdo do arquivo em base64 é obrigatório.' }, { status: 400 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'Configuração da API de IA ausente no servidor.' }, { status: 500 });
    }

    console.log(`[Extract Document] Enviando documento "${filename}" (${mimeType}) para leitura com Gemini 2.5 Flash...`);

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
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise este arquivo anexo e transcreva todo o seu conteúdo textual de forma detalhada e legível. Preserve tabelas, listas, números e o conteúdo exato das informações. Retorne APENAS a transcrição/extração textual do documento, sem explicações, saudações, introduções ou aspas.'
              },
              {
                type: 'file',
                file: {
                  filename: filename || 'anexo.pdf',
                  file_data: fileData
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error('Erro no OpenRouter ao ler arquivo:', errorText);
      return NextResponse.json({ error: 'Falha ao processar e extrair o documento no servidor da IA.' }, { status: 500 });
    }

    const aiData = await openRouterRes.json();
    const extractedText = aiData.choices?.[0]?.message?.content || '';

    console.log(`[Extract Document] Texto extraído com sucesso do arquivo "${filename}".`);

    return NextResponse.json({ text: extractedText });

  } catch (error: any) {
    console.error('Erro na rota /api/ai/extract-document:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao extrair documento.' }, { status: 500 });
  }
}
