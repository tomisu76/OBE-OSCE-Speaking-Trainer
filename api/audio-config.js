export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, message: 'Use GET.' });
  }

  const rawBaseUrl = process.env.SUPABASE_AUDIO_PUBLIC_BASE_URL || '';
  const audioBaseUrl = rawBaseUrl.replace(/\/+$/, '');

  return response.status(200).json({
    ok: true,
    audioBaseUrl,
    version: Date.now()
  });
}
