import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function getAllowedAdminEmail() {
  return (process.env.ADMIN_ALLOWED_EMAIL || "").trim().toLowerCase();
}

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

  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    const allowedAdminEmail = getAllowedAdminEmail();
    const userEmail = (user.email || "").toLowerCase();
    const metadataRole = String(user.user_metadata?.role || "").toLowerCase();
    const roleCanAccessAdmin = ["superadmin", "administrador", "admin", "duena", "dueña", "vendedora", "socia"].includes(metadataRole);

    const isSuperAdmin = Boolean(allowedAdminEmail) && userEmail === allowedAdminEmail;
    const isAuthorizedAdmin = isSuperAdmin || roleCanAccessAdmin;

    if (!isAuthorizedAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
