'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';

const STAFF_TOKEN_KEY = 'auth_token';
const TENANT_TOKEN_KEY = 'tenant_token';

export interface Staff {
  id: string;
  tenantId?: string;
  name: string;
  username: string;
  pin?: string;
  role: 'admin' | 'kasir';
  avatar: string;
  isActive: boolean;
}

export interface TenantAccount {
  id: string;
  name: string;
  email: string;
  plan: string;
}

export interface AuthContextType {
  currentTenant: TenantAccount | null;
  currentStaff: Staff | null;
  staffList: Staff[];
  tenantAuthenticated: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  tenantLogin: (email: string, password: string) => Promise<boolean>;
  staffPinLogin: (staffId: string, pin: string) => Promise<boolean>;
  logoutStaff: () => Promise<void>;
  logout: () => Promise<void>;
  verifyAdminPin: (pin: string) => Promise<boolean>;
  verifyStaffPin: (staffId: string, pin: string) => Promise<boolean>;
  addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
}

type StaffApi = {
  id: string;
  tenant_id?: string;
  name: string;
  username: string;
  pin?: string;
  role: 'admin' | 'kasir';
  avatar: string;
  is_active?: boolean;
  isActive?: boolean;
};

function mapStaff(staff: StaffApi): Staff {
  return {
    id: staff.id,
    tenantId: staff.tenant_id,
    name: staff.name,
    username: staff.username,
    pin: staff.pin,
    role: staff.role,
    avatar: staff.avatar,
    isActive: Boolean(staff.isActive ?? staff.is_active ?? false),
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<TenantAccount | null>(null);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [tenantAuthenticated, setTenantAuthenticated] = useState(false);

  const fetchStaffList = useCallback(async (): Promise<Staff[]> => {
    const response = await apiRequest<{ data: StaffApi[] }>('auth/staff-list', {
      authType: 'tenant',
    });
    const normalized = response.data.map(mapStaff);
    setStaffList(normalized);
    return normalized;
  }, []);

  const checkStaffSession = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem(STAFF_TOKEN_KEY);
    if (!token) return;

    try {
      const response = await apiRequest<{ data: StaffApi }>('auth/me', {
        authType: 'staff',
      });
      setCurrentStaff(mapStaff(response.data));
    } catch (error) {
      console.error('Failed to verify staff session:', error);
      localStorage.removeItem(STAFF_TOKEN_KEY);
      setCurrentStaff(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const tenantToken = localStorage.getItem(TENANT_TOKEN_KEY);
        setTenantAuthenticated(Boolean(tenantToken));
        if (tenantToken) {
          try {
            await fetchStaffList();
          } catch (error) {
            console.error('Failed to fetch tenant staff list:', error);
            localStorage.removeItem(TENANT_TOKEN_KEY);
            setTenantAuthenticated(false);
            setStaffList([]);
          }
        }

        await checkStaffSession();
      } finally {
        setAuthReady(true);
      }
    };

    void bootstrap();
  }, [checkStaffSession, fetchStaffList]);

  const tenantLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ data: { tenant: TenantAccount; token: string } }>('auth/tenant-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        authType: 'none',
      });

      localStorage.setItem(TENANT_TOKEN_KEY, response.data.token);
      localStorage.removeItem(STAFF_TOKEN_KEY);
      setCurrentTenant(response.data.tenant);
      setCurrentStaff(null);
      setTenantAuthenticated(true);
      await fetchStaffList();

      return true;
    } catch (error) {
      console.error('Tenant login failed:', error);
      return false;
    }
  }, [fetchStaffList]);

  const staffPinLogin = useCallback(async (staffId: string, pin: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ data: { staff: StaffApi; token: string } }>('auth/staff-pin-login', {
        method: 'POST',
        body: JSON.stringify({ staff_id: staffId, pin }),
        authType: 'tenant',
      });

      localStorage.setItem(STAFF_TOKEN_KEY, response.data.token);
      setCurrentStaff(mapStaff(response.data.staff));
      return true;
    } catch (error) {
      console.error('Staff PIN login failed:', error);
      return false;
    }
  }, []);

  const logoutStaff = useCallback(async () => {
    try {
      if (localStorage.getItem(STAFF_TOKEN_KEY)) {
        await apiRequest('auth/logout', { method: 'POST', authType: 'staff' });
      }
    } catch (error) {
      console.error('Staff logout error:', error);
    } finally {
      localStorage.removeItem(STAFF_TOKEN_KEY);
      setCurrentStaff(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutStaff();
      if (localStorage.getItem(TENANT_TOKEN_KEY)) {
        await apiRequest('auth/logout', { method: 'POST', authType: 'tenant' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(STAFF_TOKEN_KEY);
      localStorage.removeItem(TENANT_TOKEN_KEY);
      setCurrentTenant(null);
      setCurrentStaff(null);
      setStaffList([]);
      setTenantAuthenticated(false);
    }
  }, [logoutStaff]);

  const verifyAdminPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ data: { valid: boolean } }>('auth/verify-admin-pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
        authType: 'staff',
      });
      return response.data.valid;
    } catch {
      return false;
    }
  }, []);

  const verifyStaffPin = useCallback(async (staffId: string, pin: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ data: { valid: boolean } }>('auth/verify-staff-pin', {
        method: 'POST',
        body: JSON.stringify({ staff_id: staffId, pin }),
        authType: 'staff',
      });
      return response.data.valid;
    } catch {
      return false;
    }
  }, []);

  const addStaff = useCallback(async (staff: Omit<Staff, 'id'>) => {
    await apiRequest('staff', {
      method: 'POST',
      authType: 'staff',
      body: JSON.stringify({
        name: staff.name,
        username: staff.username,
        pin: staff.pin ?? '',
        role: staff.role,
        avatar: staff.avatar,
        is_active: staff.isActive,
      }),
    });
    await fetchStaffList();
  }, [fetchStaffList]);

  const updateStaff = useCallback(async (id: string, updates: Partial<Staff>) => {
    await apiRequest(`staff/${id}`, {
      method: 'PUT',
      authType: 'staff',
      body: JSON.stringify({
        name: updates.name,
        username: updates.username,
        pin: updates.pin,
        role: updates.role,
        avatar: updates.avatar,
        is_active: updates.isActive,
      }),
    });
    await fetchStaffList();
    if (currentStaff?.id === id) {
      await checkStaffSession();
    }
  }, [checkStaffSession, currentStaff?.id, fetchStaffList]);

  const deleteStaff = useCallback(async (id: string) => {
    await apiRequest(`staff/${id}`, {
      method: 'DELETE',
      authType: 'staff',
    });
    await fetchStaffList();
    if (currentStaff?.id === id) {
      await logout();
    }
  }, [currentStaff?.id, fetchStaffList, logout]);

  const value = useMemo<AuthContextType>(() => ({
    currentTenant,
    currentStaff,
    staffList,
    tenantAuthenticated,
    isAuthenticated: currentStaff !== null,
    authReady,
    tenantLogin,
    staffPinLogin,
    logoutStaff,
    logout,
    verifyAdminPin,
    verifyStaffPin,
    addStaff,
    updateStaff,
    deleteStaff,
  }), [
    addStaff,
    authReady,
    currentStaff,
    currentTenant,
    deleteStaff,
    logoutStaff,
    logout,
    staffList,
    staffPinLogin,
    tenantAuthenticated,
    tenantLogin,
    updateStaff,
    verifyAdminPin,
    verifyStaffPin,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
