import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { audio, mimeType } = await req.json();

    if (!audio) {
      return NextResponse.json({ error: 'O áudio em formato base64 é obrigatório.' }, { status: 400 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'Configuração da API de IA ausente no servidor.' }, { status: 500 });
    }

    // Limpar o prefixo data URI se houver (ex: "data:audio/webm;base64,")
    let base64Data = audio;
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }

    // Determinar o formato com base no mimeType
    let format = 'webm'; // padrão robusto para navegadores web modernos
    if (mimeType) {
      const typeLower = mimeType.toLowerCase();
      if (typeLower.includes('webm')) {
        format = 'webm';
      } else if (typeLower.includes('mp4') || typeLower.includes('m4a')) {
        format = 'mp4';
      } else if (typeLower.includes('wav')) {
        format = 'wav';
      } else if (typeLower.includes('mpeg') || typeLower.includes('mp3')) {
        format = 'mp3';
      } else if (typeLower.includes('ogg')) {
        format = 'ogg';
      } else if (typeLower.includes('aac')) {
        format = 'aac';
      }
    }

    console.log(`[Transcribe] Iniciando transcrição com Whisper-large-v3. Formato: ${format}`);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pillar.io',
          'X-Title': 'Metodo Senda Core',
        },
        body: JSON.stringify({
          model: 'openai/whisper-large-v3',
          input_audio: {
            data: base64Data,
            format: format,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text || '';
        console.log(`[Transcribe] Sucesso com Whisper. Texto transcrito: "${text}"`);
        return NextResponse.json({ text });
      }

      const errorText = await response.text();
      console.warn(`[Transcribe] Erro no Whisper (status ${response.status}): ${errorText}. Tentando fallback com Gemini...`);
    } catch (whisperErr: any) {
      console.warn(`[Transcribe] Falha de conexão com Whisper: ${whisperErr.message}. Tentando fallback com Gemini...`);
    }

    // FALLBACK: Usar o Gemini 2.5 Flash multimodal para extrair o texto do áudio
    console.log(`[Transcribe] Executando fallback com Gemini 2.5 Flash...`);
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                text: 'Transcreva o áudio a seguir exatamente como foi falado, em português do Brasil. Retorne APENAS a transcrição pura, sem aspas, sem explicações, introduções ou notas extras. Se o áudio estiver completamente silencioso ou sem fala compreensível, retorne uma string vazia.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Data,
                  format: format,
                }
              }
            ]
          }
        ],
        temperature: 0.0
      }),
    });

    if (!fallbackResponse.ok) {
      const errorText = await fallbackResponse.text();
      console.error('[Transcribe] Falha no fallback com Gemini:', errorText);
      return NextResponse.json({ 
        error: 'Falha ao transcrever o áudio no servidor da IA (Whisper e Gemini falharam).',
        details: errorText
      }, { status: 500 });
    }

    const fallbackData = await fallbackResponse.json();
    const text = fallbackData.choices?.[0]?.message?.content || '';
    console.log(`[Transcribe] Sucesso com Gemini. Texto transcrito: "${text}"`);

    return NextResponse.json({ text: text.trim() });

  } catch (error: any) {
    console.error('Erro na rota /api/ai/transcribe:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar áudio.' }, { status: 500 });
  }
}
