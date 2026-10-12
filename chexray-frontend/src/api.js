const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(`Could not reach the API at ${API_URL}. Is the backend running?`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const d = body.detail;
    throw new Error(
      typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join('; ') : `Request failed (${res.status})`
    );
  }
  return res.json();
}

export const getDoctors = () => request('/doctors');
export const getSpecialties = () => request('/specialties');
export const getSlots = (doctorId) => request(`/doctors/${doctorId}/slots`);
export const recommendDoctors = (predictions) =>
  request('/doctors/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ predictions }),
  });

export function bookConsult({ payload, image }) {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  if (image) form.append('image', image);
  return request('/consult', { method: 'POST', body: form });
}

export async function streamChat({ messages, predictions, onToken, signal }) {
  let res;
  try {
    res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, predictions }),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(`Could not reach the API at ${API_URL}. Is the backend running?`, { cause: error });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    throw new Error(
      typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((item) => item.msg).join('; ') : `Request failed (${res.status})`
    );
  }
  if (!res.body) throw new Error('Streaming is not supported by this browser.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onToken(decoder.decode(value, { stream: true }));
    }
    const remaining = decoder.decode();
    if (remaining) onToken(remaining);
  } finally {
    reader.releaseLock();
  }
}