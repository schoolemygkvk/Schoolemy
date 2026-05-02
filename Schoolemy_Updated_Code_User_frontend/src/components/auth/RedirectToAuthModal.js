import { Navigate, useSearchParams } from "react-router-dom";

/**
 * Legacy URLs (/login, /signup, /register) redirect into Layout with query flags
 * so auth uses the same popup modals as the header — no separate full-page auth.
 */
export default function RedirectToAuthModal({ auth }) {
  const [searchParams] = useSearchParams();
  const sp = new URLSearchParams();
  sp.set("auth", auth);
  const redirect = searchParams.get("redirect");
  if (redirect) sp.set("redirect", redirect);
  return <Navigate to={`/?${sp.toString()}`} replace />;
}
