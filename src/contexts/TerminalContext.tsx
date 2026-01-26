'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface TerminalLog {
  message: string;
  type: 'info' | 'success' | 'error' | 'progress' | 'warning';
  timestamp: string;
}

export interface TerminalAction {
  label: string;
  onClick: () => void;
  color?: string;
  icon?: React.ReactNode;
}

interface TerminalContextType {
  logs: TerminalLog[];
  isOpen: boolean;
  isMinimized: boolean;
  isSyncing: boolean;
  title: string;
  actions: TerminalAction[];
  log: (message: string, type?: TerminalLog['type']) => void;
  clear: () => void;
  open: (title?: string) => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  toggle: () => void;
  startSync: (title?: string) => void;
  endSync: (actions?: TerminalAction[]) => void;
  setActions: (actions: TerminalAction[]) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [title, setTitle] = useState('Terminal');
  const [actions, setActions] = useState<TerminalAction[]>([]);

  const log = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    const newLog: TerminalLog = {
      message,
      type,
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
    setActions([]);
  }, []);

  const open = useCallback((newTitle?: string) => {
    if (newTitle) setTitle(newTitle);
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(true);
  }, []);

  const minimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const toggle = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsMinimized(true);
    }
  }, [isMinimized]);

  const startSync = useCallback((newTitle?: string) => {
    clear();
    if (newTitle) setTitle(newTitle);
    setIsSyncing(true);
    setIsOpen(true);
    setIsMinimized(false);
  }, [clear]);

  const endSync = useCallback((newActions?: TerminalAction[]) => {
    setIsSyncing(false);
    if (newActions) {
      setActions(newActions);
    }
  }, []);

  const value: TerminalContextType = {
    logs,
    isOpen,
    isMinimized,
    isSyncing,
    title,
    actions,
    log,
    clear,
    open,
    close,
    minimize,
    maximize,
    toggle,
    startSync,
    endSync,
    setActions,
  };

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}
