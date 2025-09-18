import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const body = await request.json();
  const { value, key } = body;

  cookieStore.set(key, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return Response.json({ success: true });
}
