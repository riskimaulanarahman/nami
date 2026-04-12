'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================================================
// Type Definitions
// ============================================================

export interface Staff {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: 'admin' | 'kasir';
  avatar: string;
  isActive: boolean;
}

export interface AuthContextType {
  currentStaff: Staff | null;
  isAuthenticated: boolean;
  authReady: boolean;
  login: (staffId: string, pin: string) => boolean;
  logout: () => void;
  verifyAdminPin: (pin: string) => boolean;
  verifyStaffPin: (staffId: string, pin: string) => boolean;
  staffList: Staff[];
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
}

// ============================================================
// Dummy Staff Data
// ============================================================

const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff-1',
    name: 'Admin',
    username: 'admin',
    pin: '1234',
    role: 'admin',
    avatar: 'AD',
    isActive: true,
  },
  {
    id: 'staff-2',
    name: 'Kasir Satu',
    username: 'kasir1',
    pin: '0000',
    role: 'kasir',
    avatar: 'K1',
    isActive: true,
  },
  {
    id: 'staff-3',
    name: 'Kasir Dua',
    username: 'kasir2',
    pin: '0000',
    role: 'kasir',
    avatar: 'K2',
    isActive: true,
  },
];

const AUTH_STORAGE_KEY = 'auth-session:v1';

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        setAuthReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<{
        staffList: Staff[];
        currentStaffId: string | null;
      }>;
      const nextStaffList = parsed.staffList?.length ? parsed.staffList : INITIAL_STAFF;
      setStaffList(nextStaffList);
      const nextCurrentStaff = parsed.currentStaffId
        ? nextStaffList.find((staff) => staff.id === parsed.currentStaffId && staff.isActive) ?? null
        : null;
      setCurrentStaff(nextCurrentStaff);
    } catch {
      setStaffList(INITIAL_STAFF);
      setCurrentStaff(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!authReady || typeof window === 'undefined') return;
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        staffList,
        currentStaffId: currentStaff?.id ?? null,
      })
    );
  }, [authReady, currentStaff, staffList]);

  const login = useCallback((staffId: string, pin: string): boolean => {
    const staff = staffList.find(
      (s) => s.id === staffId && s.pin === pin && s.isActive
    );
    if (staff) {
      setCurrentStaff(staff);
      return true;
    }
    return false;
  }, [staffList]);

  const logout = useCallback(() => {
    setCurrentStaff(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          staffList,
          currentStaffId: null,
        })
      );
    }
  }, [staffList]);

  // Verify an admin/owner PIN without changing login state
  const verifyAdminPin = useCallback((pin: string): boolean => {
    return staffList.some(
      (s) => s.role === 'admin' && s.pin === pin && s.isActive
    );
  }, [staffList]);

  const verifyStaffPin = useCallback((staffId: string, pin: string): boolean => {
    return staffList.some(
      (s) => s.id === staffId && s.pin === pin && s.isActive
    );
  }, [staffList]);

  const addStaff = useCallback((staff: Omit<Staff, 'id'>) => {
    const newId = `staff-${Date.now()}`;
    setStaffList((prev) => [...prev, { ...staff, id: newId }]);
  }, []);

  const updateStaff = useCallback((id: string, updates: Partial<Staff>) => {
    setStaffList((prev) => {
      const nextStaffList = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setCurrentStaff((curr) => {
        if (!curr || curr.id !== id) return curr;
        const updatedCurrent = nextStaffList.find((staff) => staff.id === id) ?? null;
        return updatedCurrent && updatedCurrent.isActive ? updatedCurrent : null;
      });
      return nextStaffList;
    });
    // Update currentStaff if the updated staff is the currently logged in one
  }, []);

  const deleteStaff = useCallback(
    (id: string) => {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setCurrentStaff((curr) => (curr?.id === id ? null : curr));
    },
    []
  );

  const value: AuthContextType = {
    currentStaff,
    isAuthenticated: currentStaff !== null,
    authReady,
    login,
    logout,
    verifyAdminPin,
    verifyStaffPin,
    staffList,
    addStaff,
    updateStaff,
    deleteStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
