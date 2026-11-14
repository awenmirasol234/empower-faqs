import { useCallback, useEffect, useState } from "react";
import { checkAdminSession, logoutAdmin } from "../services/contentService.ts";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async () => {
    setChecking(true);
    try {
      const valid = await checkAdminSession();
      setIsAuthenticated(valid);
      return valid;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  const logout = useCallback(async () => {
    await logoutAdmin().catch(() => {});
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, checking, verify, logout };
}
