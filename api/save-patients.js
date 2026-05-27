async function readCurrentFileSha(apiBase, path, headers) {
  const currentFileResponse = await fetch(`${apiBase}/contents/${path}?ref=main&ts=${Date.now()}`, { headers });

  if (currentFileResponse.ok) {
    const currentFile = await currentFileResponse.json();
    return currentFile.sha;
  }

  if (currentFileResponse.status === 404) return null;

  const details = await currentFileResponse.text();
  const error = new Error('Could not read current patients file. Check that GITHUB_WORKFLOW_TOKEN has Contents: Read and write permission.');
  error.status = currentFileResponse.status;
  error.details = details;
  throw error;
}

async function savePatientsFileWithRetry({ apiBase, path, headers, saveBodyBase }) {
  let lastDetails = '';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const currentSha = await readCurrentFileSha(apiBase, path, headers);
    const saveBody = { ...saveBodyBase };
    if (currentSha) saveBody.sha = currentSha;

    const saveResponse = await fetch(`${apiBase}/contents/${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(saveBody)
    });

    if (saveResponse.ok) return { ok: true, attempt };

    lastDetails = await saveResponse.text();

    if (saveResponse.status !== 409) {
      const message = saveResponse.status === 404
        ? 'Could not save patients file. The GitHub token probably cannot access tomisu76/OBE-OSCE-Speaking-Trainer, or it does not have Contents: Read and write permission.'
        : 'Could not save patients file.';
      const error = new Error(message);
      error.status = saveResponse.status;
      error.details = lastDetails;
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 450 * attempt));
  }

  const conflictError = new Error('Could not save patients file because GitHub still reports a version conflict. Refresh the page to load the latest patient file, then save again.');
  conflictError.status = 409;
  conflictError.details = lastDetails;
  throw conflictError;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, message: 'Use POST.' });
  }

  const configuredAdminKey = process.env.AUDIO_ADMIN_KEY;
  const providedAdminKey = request.headers['x-admin-key'];

  if (configuredAdminKey && providedAdminKey !== configuredAdminKey) {
    return response.status(401).json({ ok: false, message: 'Wrong admin code.' });
  }

  const token = process.env.GITHUB_WORKFLOW_TOKEN;
  if (!token) {
    return response.status(500).json({ ok: false, message: 'Missing GITHUB_WORKFLOW_TOKEN environment variable in Vercel.' });
  }

  let body;
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch {
    return response.status(400).json({ ok: false, message: 'Invalid JSON body.' });
  }

  const patients = body?.patients;
  const regenerateAudio = Boolean(body?.regenerateAudio);

  if (!Array.isArray(patients) || patients.length === 0) {
    return response.status(400).json({ ok: false, message: 'patients must be a non-empty array.' });
  }

  for (const patient of patients) {
    if (!patient.id || !patient.name || !Array.isArray(patient.lines)) {
      return response.status(400).json({ ok: false, message: 'Each patient needs id, name, and lines.' });
    }
  }

  const owner = 'tomisu76';
  const repo = 'OBE-OSCE-Speaking-Trainer';
  const path = 'data/patients.json';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'OBE-OSCE-Speaking-Trainer-Vercel-App'
  };

  const content = JSON.stringify(patients, null, 2) + '\n';
  const encodedContent = Buffer.from(content, 'utf8').toString('base64');

  const saveBodyBase = {
    message: regenerateAudio ? 'Update patient text and regenerate audio' : 'Update patient text',
    content: encodedContent,
    branch: 'main'
  };

  let saveResult;
  try {
    saveResult = await savePatientsFileWithRetry({ apiBase, path, headers, saveBodyBase });
  } catch (error) {
    return response.status(error.status || 500).json({
      ok: false,
      message: error.message || 'Could not save patients file.',
      details: error.details || ''
    });
  }

  let workflowStarted = false;
  if (regenerateAudio) {
    const workflowResponse = await fetch(`${apiBase}/actions/workflows/generate-audio.yml/dispatches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: 'main' })
    });

    if (!workflowResponse.ok) {
      const details = await workflowResponse.text();
      const message = workflowResponse.status === 404
        ? 'Patients saved, but audio workflow could not start. Check that GITHUB_WORKFLOW_TOKEN has Actions: Read and write permission.'
        : 'Patients saved, but audio workflow could not start.';
      return response.status(workflowResponse.status).json({ ok: false, message, details });
    }
    workflowStarted = true;
  }

  return response.status(200).json({
    ok: true,
    workflowStarted,
    saveAttempt: saveResult.attempt,
    message: workflowStarted
      ? 'Saved. New Kokoro audio generation started. Old files will be overwritten after GitHub Actions finishes.'
      : 'Saved. Audio was not regenerated.'
  });
}
