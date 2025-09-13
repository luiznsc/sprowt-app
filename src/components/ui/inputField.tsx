import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'telefone' 
  | 'cpf' 
  | 'cep' 
  | 'currency' 
  | 'date' 
  | 'number';

interface InputFieldProps {
  label?: string;
  type?: InputType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  id?: string;
}

// Máscaras simples sem regex
const masks = {
  telefone: (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 11);
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  },

  cpf: (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  },

  cep: (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  },

  currency: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
};

// Validações simples
const validations = {
  email: (value: string) => {
    if (!value) return '';
    const isValid = value.includes('@') && value.includes('.');
    return isValid ? '' : 'E-mail inválido';
  },

  telefone: (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    return numbers.length >= 10 ? '' : 'Telefone deve ter pelo menos 10 dígitos';
  },

  cpf: (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    return numbers.length === 11 ? '' : 'CPF deve ter 11 dígitos';
  },

  required: (value: string) => {
    return value.trim() ? '' : 'Campo obrigatório';
  }
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ 
    label, 
    type = 'text', 
    value, 
    onChange, 
    placeholder, 
    required = false, 
    error, 
    className, 
    disabled = false, 
    maxLength,
    id,
    ...props 
  }, ref) => {
    const [internalError, setInternalError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      if (masks[type as keyof typeof masks]) {
        newValue = masks[type as keyof typeof masks](newValue);
      }

      onChange(newValue);

      let validationError = '';
      
      if (required && !newValue.trim()) {
        validationError = validations.required(newValue);
      } else if (validations[type as keyof typeof validations]) {
        validationError = validations[type as keyof typeof validations](newValue);
      }

      setInternalError(validationError);
    };

    const getInputType = () => {
      switch (type) {
        case 'email': return 'email';
        case 'password': return 'password';
        case 'date': return 'date';
        case 'number': return 'number';
        default: return 'text';
      }
    };

    const getMaxLength = () => {
      if (maxLength) return maxLength;
      switch (type) {
        case 'telefone': return 15;
        case 'cpf': return 14;
        case 'cep': return 9;
        default: return undefined;
      }
    };

    const getPlaceholder = () => {
      if (placeholder) return placeholder;
      switch (type) {
        case 'telefone': return '(11) 99999-9999';
        case 'cpf': return '000.000.000-00';
        case 'cep': return '00000-000';
        case 'email': return 'seu@email.com';
        default: return undefined;
      }
    };

    const displayError = error || internalError;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          id={id}
          type={getInputType()}
          value={value}
          onChange={handleChange}
          
          placeholder={getPlaceholder()}
          disabled={disabled}
          maxLength={getMaxLength()}
          className={cn(
            "bg-gray-200 border-input transition-colors", 
            "focus:outline-none focus:ring-0 focus:border-gray-300", 
            displayError && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
        {displayError && (
          <p className="text-sm text-red-500 mt-1">{displayError}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
