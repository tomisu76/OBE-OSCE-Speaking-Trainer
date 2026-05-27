export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, message: 'Use GET.' });
  }

  return response.status(200).json({
    audioBaseUrl: process.env.SUPABASE_AUDIO_PUBLIC_BASE_URL || '',
    version: Date.now()
  });
}
