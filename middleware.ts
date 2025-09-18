import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/register"];
const publicGlobalPaths = ["/privacy", "/terms", "/404"];
const privatePaths = ["/dashboard", "/account", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token");
  const profile = request.cookies.get("profile");
  const isPublicRoute = publicPaths.includes(pathname);
  const isPublicGlobalRoute = publicGlobalPaths.includes(pathname);
  const knownRoutes = [...publicPaths, ...publicGlobalPaths, ...privatePaths];

  if (!knownRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  if (isPublicGlobalRoute) {
    return NextResponse.next();
  }

  if (isPublicRoute) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && !profile) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}profile`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (response.status === 200) {
      const profileDate = await response.json();
      const nextResponse = NextResponse.next();
      nextResponse.cookies.set("profile", JSON.stringify(profileDate), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1,
      });
      return nextResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Inclui explicitamente a raiz "/" (que vira /fs por causa do basePath)
    "/",
    // E todas as demais rotas, excluindo assets e api
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico)$).*)",
  ],
};
