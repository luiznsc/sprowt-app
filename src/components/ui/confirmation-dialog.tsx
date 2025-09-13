import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmationOptions } from '@/hooks/use-confirmation';

interface ConfirmationDialogProps {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ 
  isOpen, 
  options, 
  onConfirm, 
  onCancel 
}: ConfirmationDialogProps) {
  if (!options) return null;

  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'default'
  } = options;

  const Icon = variant === 'destructive' ? AlertTriangle : Info;

  return (
    <Dialog open={isOpen} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${
              variant === 'destructive' 
                ? 'text-destructive' 
                : 'text-primary'
            }`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className="min-w-[80px]"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
