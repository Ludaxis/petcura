export const ownerSessionCookieName =
  process.env.NODE_ENV === "production"
    ? "__Host-pc_owner_session"
    : "pc_owner_session";

export const ownerSessionCookieOptions = {
  name: ownerSessionCookieName,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};
