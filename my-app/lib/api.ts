const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function loginUser(phone_number: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}
