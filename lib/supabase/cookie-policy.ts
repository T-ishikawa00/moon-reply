function configuredLoopbackHttp() {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
    return (
      origin.protocol === "http:" &&
      (origin.hostname === "localhost" ||
        origin.hostname === "127.0.0.1" ||
        origin.hostname === "[::1]" ||
        origin.hostname === "::1")
    );
  } catch {
    return false;
  }
}

export const CUSTOMER_AUTH_COOKIE_POLICY = Object.freeze({
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production" && !configuredLoopbackHttp(),
  sameSite: "lax" as const,
  path: "/",
});
