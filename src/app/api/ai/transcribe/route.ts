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

    console.log(`Enviando áudio para transcrição no OpenRouter. Formato deduzido: ${format}`);

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta do OpenRouter para transcrição:', errorText);
      return NextResponse.json({ error: 'Falha ao transcrever o áudio no servidor da IA.' }, { status: 500 });
    }

    const data = await response.json();
    
    // O retorno padrão do OpenAI/OpenRouter transcrições costuma ser { text: "..." }
    const text = data.text || '';

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Erro na rota /api/ai/transcribe:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar áudio.' }, { status: 500 });
  }
}
