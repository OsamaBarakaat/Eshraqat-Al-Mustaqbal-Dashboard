"use client";

import React from "react";
import { ModuleType, ActionType } from "@/types/team";
import { usePermissions } from "@/lib/hooks/use-permissions";

interface PermissionGuardProps {
  module: ModuleType;
  action: ActionType;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGuard conditionally renders its children only if the active user
 * has the required permission for the target module and action.
 */
export function PermissionGuard({
  module,
  action,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
