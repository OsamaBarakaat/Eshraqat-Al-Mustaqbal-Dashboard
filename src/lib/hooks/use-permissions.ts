"use client";

import { useState, useEffect, useCallback } from "react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { AdminUser, Role, ModuleType, ActionType } from "@/types/team";

export function usePermissions() {
  const [user, setUser] = useState<AdminUser>(MockStore.getCurrentUser());
  const [role, setRole] = useState<Role | undefined>(MockStore.getCurrentRole());
  const [allUsers, setAllUsers] = useState<AdminUser[]>(MockStore.getUsers());

  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      setUser(MockStore.getCurrentUser());
      setRole(MockStore.getCurrentRole());
      setAllUsers(MockStore.getUsers());
    });
    return unsubscribe;
  }, []);

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const hasPermission = useCallback(
    (module: ModuleType, action: ActionType): boolean => {
      return MockStore.hasPermission(module, action);
    },
    []
  );

  const can = hasPermission;

  const hasModule = useCallback((module: ModuleType): boolean => {
    return MockStore.hasModuleAccess(module);
  }, []);

  const switchUser = useCallback((userId: string) => {
    MockStore.setCurrentUser(userId);
  }, []);

  return {
    user,
    role,
    isSuperAdmin,
    can,
    hasPermission,
    hasModule,
    switchUser,
    allUsers,
  };
}
