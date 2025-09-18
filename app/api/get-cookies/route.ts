import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  const value = cookieStore.get(key || "");

  const result = value?.value || null;

  return Response.json(result);
}
