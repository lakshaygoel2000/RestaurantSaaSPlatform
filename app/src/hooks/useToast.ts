import { useState, useCallback, useEffect } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

function addToast(message: string, type: Toast["type"] = "info", duration = 3000) {
  const id = Math.random().toString(36).substring(2, 9);
  const toast: Toast = { id, message, type, duration };
  toasts = [...toasts, toast];
  notifyListeners();

  setTimeout(() => {
    removeToast(id);
  }, duration);

  return id;
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function toast(message: string, type?: Toast["type"], duration?: number) {
  return addToast(message, type, duration);
}

export function useToast() {
  const [, setLocalToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setLocalToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    toasts,
    toast: useCallback((message: string, type?: Toast["type"], duration?: number) => {
      return addToast(message, type, duration);
    }, []),
    success: useCallback((message: string, duration?: number) => addToast(message, "success", duration), []),
    error: useCallback((message: string, duration?: number) => addToast(message, "error", duration), []),
    warning: useCallback((message: string, duration?: number) => addToast(message, "warning", duration), []),
    info: useCallback((message: string, duration?: number) => addToast(message, "info", duration), []),
    dismiss: useCallback((id: string) => removeToast(id), []),
  };
}
