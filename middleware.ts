import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/register"];
const publicGlobalPaths = ["/privacy", "/terms", "/404"];
const privatePaths = ["/dashboard", "/account", "/settings"];

function decodeJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    if (base64.length % 4) {
      base64 += "=".repeat(4 - (base64.length % 4));
    }
    const json = atob(base64);
    return JSON.parse(json);
  } catch (_e) {
    return null;
  }
}

async function tokenIsValid(
  token: string | undefined,
  refreshToken: string | undefined,
  profileCookie: string | undefined,
  request: NextRequest
) {
  if (!token) return null;
  const decodedToken = decodeJwt(token);
  const exp = decodedToken?.exp as number | undefined;
  const now = Math.floor(Date.now() / 1000);

  if (decodedToken && (typeof exp !== "number" || exp >= now)) {
    return null;
  }

  if (!refreshToken) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    response.cookies.delete("profile");
    return response;
  }

  const decodedRefresh = decodeJwt(refreshToken);
  const refreshExp = decodedRefresh?.exp as number | undefined;
  if (!decodedRefresh || (typeof refreshExp === "number" && refreshExp < now)) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    response.cookies.delete("profile");
    return response;
  }

  try {
    const refreshResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!refreshResponse.ok) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      response.cookies.delete("profile");
      return response;
    }

    const data = await refreshResponse.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token;
    if (!newAccessToken || !newRefreshToken) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      response.cookies.delete("profile");
      return response;
    }

    const nextResponse = NextResponse.next();
    const commonOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    nextResponse.cookies.set("access_token", newAccessToken, {
      ...commonOptions,
    });
    nextResponse.cookies.set("refresh_token", newRefreshToken, {
      ...commonOptions,
    });

    if (!profileCookie) {
      try {
        const profileRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}profile`,
          {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          }
        );
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          nextResponse.cookies.set("profile", JSON.stringify(profileData), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });
        }
      } catch (_e) {}
    }

    return nextResponse;
  } catch (_e) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    response.cookies.delete("profile");
    return response;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token");
  const profile = request.cookies.get("profile");
  const refreshToken = request.cookies.get("refresh_token");
  const isPublicRoute = publicPaths.includes(pathname);
  const isPublicGlobalRoute = publicGlobalPaths.includes(pathname);
  const isPrivateRoute = privatePaths.includes(pathname);
  const knownRoutes = [...publicPaths, ...publicGlobalPaths, ...privatePaths];
  const decodedToken = token ? decodeJwt(token.value) : null;

  if (!knownRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  if (isPublicGlobalRoute) {
    return NextResponse.next();
  }

  if (isPublicRoute) {
    if (token && decodedToken?.exp && decodedToken.exp * 1000 > Date.now()) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (token && decodedToken?.exp && decodedToken.exp * 1000 <= Date.now()) {
      const response = NextResponse.next();
      response.cookies.delete("access_token");
      response.cookies.delete("profile");
      return response;
    }
    return NextResponse.next();
  }

  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPrivateRoute) {
    const validationResult = await tokenIsValid(
      token?.value,
      refreshToken?.value,
      profile?.value,
      request
    );
    if (validationResult) return validationResult;
  }

  if (token && isPrivateRoute && !profile) {
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
