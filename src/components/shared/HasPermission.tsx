import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_PERMISSIONS } from '../../utils/permissions';
import type { PermissionCode, AdminRole } from '../../types';

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  // If user object has explicit permissions list from server, use it;
  // otherwise fallback to role mapping
  const permissions: string[] = React.useMemo(() => {
    if (!user) return [];
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }
    const role = user.role as AdminRole;
    return ROLE_PERMISSIONS[role] || [];
  }, [user]);

  const can = (code: PermissionCode | string): boolean => {
    return permissions.includes(code);
  };

  const canAny = (codes: (PermissionCode | string)[]): boolean => {
    return codes.some((c) => permissions.includes(c));
  };

  const canAll = (codes: (PermissionCode | string)[]): boolean => {
    return codes.every((c) => permissions.includes(c));
  };

  return { permissions, can, canAny, canAll };
}

interface HasPermissionProps {
  code?: PermissionCode | string;
  anyOf?: (PermissionCode | string)[];
  allOf?: (PermissionCode | string)[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HasPermission({
  code,
  anyOf,
  allOf,
  children,
  fallback = null
}: HasPermissionProps): JSX.Element {
  const { can, canAny, canAll } = usePermission();

  if (code && !can(code)) {
    return <>{fallback}</>;
  }

  if (anyOf && !canAny(anyOf)) {
    return <>{fallback}</>;
  }

  if (allOf && !canAll(allOf)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
