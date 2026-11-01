import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminLoggedIn } from "@/lib/adminAuth";

/** Protects /admin/* — hardcoded Admin / Admin@123 on the home page. */
export function RequireAdmin() {
  const location = useLocation();
  if (!isAdminLoggedIn()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
