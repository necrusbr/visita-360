import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [field: string]: ValidationRule;
}

interface ValidationErrors {
  [field: string]: string;
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  rules: ValidationRules = {}
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar um campo específico
  const validateField = useCallback((field: string, value: any): string | null => {
    const rule = rules[field];
    if (!rule) return null;

    // Campo obrigatório
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Este campo é obrigatório';
    }

    // Se não é obrigatório e está vazio, não valida outros critérios
    if (!rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return null;
    }

    const stringValue = String(value || '');

    // Comprimento mínimo
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Deve ter pelo menos ${rule.minLength} caracteres`;
    }

    // Comprimento máximo
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `Deve ter no máximo ${rule.maxLength} caracteres`;
    }

    // Padrão regex
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'Formato inválido';
    }

    // Validação customizada
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  // Validar todos os campos
  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [data, rules, validateField]);

  // Atualizar um campo
  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));

    // Marcar campo como tocado
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validar campo em tempo real se já foi tocado
    if (touched[field as string]) {
      const error = validateField(field as string, value);
      setErrors(prev => ({
        ...prev,
        [field]: error || undefined
      }));
    }
  }, [touched, validateField]);

  // Atualizar múltiplos campos
  const updateFields = useCallback((updates: Partial<T>) => {
    setData(prev => ({
      ...prev,
      ...updates
    }));

    // Marcar campos como tocados
    const fieldNames = Object.keys(updates);
    setTouched(prev => ({
      ...prev,
      ...fieldNames.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    }));

    // Validar campos atualizados
    const newErrors = { ...errors };
    fieldNames.forEach(field => {
      if (touched[field]) {
        const error = validateField(field, updates[field as keyof T]);
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
      }
    });
    setErrors(newErrors);
  }, [errors, touched, validateField]);

  // Marcar campo como tocado
  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validar o campo quando for tocado
    const error = validateField(field as string, data[field]);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  }, [data, validateField]);

  // Reset do formulário
  const reset = useCallback((newData?: T) => {
    setData(newData || initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  // Limpar erros
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Verificar se tem erros
  const hasErrors = Object.keys(errors).length > 0;

  // Verificar se o formulário foi modificado
  const isDirty = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(initialData);
  }, [data, initialData]);

  // Obter erro de um campo
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors[field as string];
  }, [errors]);

  // Verificar se um campo tem erro
  const hasFieldError = useCallback((field: keyof T): boolean => {
    return Boolean(errors[field as string]);
  }, [errors]);

  // Verificar se um campo foi tocado
  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return Boolean(touched[field as string]);
  }, [touched]);

  return {
    data,
    errors,
    touched,
    hasErrors,
    validateField,
    validateAll,
    updateField,
    updateFields,
    touchField,
    reset,
    clearErrors,
    isDirty,
    getFieldError,
    hasFieldError,
    isFieldTouched
  };
}

// Regras de validação pré-definidas
export const commonValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email deve ter um formato válido';
      }
      return null;
    }
  },
  
  phone: {
    pattern: /^\(?([0-9]{2})\)?[-.\s]?([0-9]{4,5})[-.\s]?([0-9]{4})$/,
    custom: (value: string) => {
      if (value && !/^\(?([0-9]{2})\)?[-.\s]?([0-9]{4,5})[-.\s]?([0-9]{4})$/.test(value)) {
        return 'Telefone deve ter formato válido (ex: (11) 99999-9999)';
      }
      return null;
    }
  },
  
  coordinates: {
    custom: (value: string) => {
      if (value) {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return 'Deve ser um número válido';
        }
      }
      return null;
    }
  },
  
  latitude: {
    custom: (value: string) => {
      if (value) {
        const num = parseFloat(value);
        if (isNaN(num) || num < -90 || num > 90) {
          return 'Latitude deve estar entre -90 e 90';
        }
      }
      return null;
    }
  },
  
  longitude: {
    custom: (value: string) => {
      if (value) {
        const num = parseFloat(value);
        if (isNaN(num) || num < -180 || num > 180) {
          return 'Longitude deve estar entre -180 e 180';
        }
      }
      return null;
    }
  },

  currency: {
    custom: (value: string | number) => {
      if (value) {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || num < 0) {
          return 'Valor deve ser um número positivo';
        }
      }
      return null;
    }
  }
};