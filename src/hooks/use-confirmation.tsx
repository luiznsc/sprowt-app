import { useState } from 'react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface PromiseControl {
  resolve: (value: boolean) => void;
}

export function useConfirmation() {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [promiseControl, setPromiseControl] = useState<PromiseControl | null>(null);

  function confirm(opts: ConfirmationOptions): Promise<boolean> {
    setOptions(opts);
    
    return new Promise<boolean>((resolve) => {
      setPromiseControl({ resolve });
    });
  }

  function handleConfirm() {
    setOptions(null);
    if (promiseControl) {
      promiseControl.resolve(true);
      setPromiseControl(null);
    }
  }

  function handleCancel() {
    setOptions(null);
    if (promiseControl) {
      promiseControl.resolve(false);
      setPromiseControl(null);
    }
  }

  const isOpen = !!options;

  return {
    confirm,
    isOpen,
    options,
    handleConfirm,
    handleCancel
  };
}
