'use client';

import { useState, useCallback } from 'react';
import { sanitizeInput } from '@/lib/security';

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  style?: React.CSSProperties;
  type?: 'text' | 'search';
}

/**
 * Secure input component that sanitizes all user input in real-time.
 * Prevents XSS, injection, and oversized payloads.
 */
export function SecureInput({ value, onChange, placeholder, maxLength = 200, style, type = 'text' }: SecureInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Sanitize in real-time
    const clean = sanitizeInput(raw).slice(0, maxLength);
    onChange(clean);
  }, [onChange, maxLength]);

  // Prevent paste of malicious content
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain');
    const clean = sanitizeInput(pasted).slice(0, maxLength);
    onChange(value + clean);
  }, [onChange, value, maxLength]);

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholder={placeholder}
      maxLength={maxLength}
      autoComplete="off"
      spellCheck={false}
      data-lpignore="true"
      data-form-type="other"
      style={{
        background: 'var(--surface-2)',
        border: `1px solid ${isFocused ? 'var(--accent)' : 'var(--border-default)'}`,
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '13px',
        color: 'var(--text-primary)',
        outline: 'none',
        transition: 'border-color var(--duration-fast) var(--ease-out)',
        ...style,
      }}
    />
  );
}
