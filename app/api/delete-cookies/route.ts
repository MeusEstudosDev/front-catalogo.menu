import { cookies } from "next/headers";

export async function DELETE(request: Request) {
  const cookieStore = cookies();

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key) (await cookieStore).delete(key);

  return Response.json({ success: true });
}
