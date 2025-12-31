// proxy.ts — Next.js 16 Middleware Replacement

const protectedRoutes = [
  "/account",
  "/orders",
  "/wishlist",
  "/addresses",
  "/notifications",
  "/dashboard",
  "/products",
  "/seller/orders",
];

export default async function proxy(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return; // allow request to continue
  }

  // ----- READ COOKIES -----
  const cookieHeader = req.headers.get("cookie") || "";
  const token = extractCookie(cookieHeader, "token");
  const role = extractCookie(cookieHeader, "role");

  const unAuthRoutes = ["/login", "/register", "/auth/login", "/auth/register"]; // Adjust paths as necessary

  if (token && unAuthRoutes.includes(pathname)) {
    // Determine where to redirect based on the role, defaulting to /account
    let destination = "/account";
    if (role === "vendor") {
      destination = "/dashboard";
    }

    return Response.redirect(`${url.origin}${destination}`, 302);
  }

  // Not authenticated → redirect to login
  if (isProtected && !token) {
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("redirect", pathname);
    return Response.redirect(redirectUrl.toString(), 302);
  }

  // Customer-only routes
  if (pathname.startsWith("/account") && role !== "customer") {
    return Response.redirect(`${url.origin}/unauthorized`, 302);
  }

  // Vendor-only routes
  if (pathname.startsWith("/dashboard") && role !== "vendor") {
    return Response.redirect(`${url.origin}/unauthorized`, 302);
  }

  // allowed
  return;
}

// --- Helper for reading cookies ---
function extractCookie(cookieString: string, name: string): string | null {
  const match = cookieString.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export const config = {
  matcher: [
    "/account/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/addresses/:path*",
    "/notifications/:path*",
    "/dashboard/:path*",
    "/products/:path*",
    "/seller/orders/:path*",
  ],
};
