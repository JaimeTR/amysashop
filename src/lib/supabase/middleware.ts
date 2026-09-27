import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function getRouteScope(pathname: string) {
  if (pathname === "/banner") {
    return "banner";
  }

  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  return "public";
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-amysa-route-scope", getRouteScope(request.nextUrl.pathname));
  requestHeaders.set("x-amysa-digital", request.nextUrl.pathname.startsWith("/digital") ? "1" : "0");

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath = ["/perfil", "/favoritos", "/admin"].some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // La autorización por rol de /admin la hace requireAdminUser (src/app/admin/layout.tsx),
  // que lee el rol desde profiles. No usar user_metadata aquí: el usuario puede editarlo.

  return response;
}
