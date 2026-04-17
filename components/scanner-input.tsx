"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

type ScannerInputProps = {
  value: string;
  onChange: (value: string) => void;
  onScan: (codigo: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
};

export function ScannerInput({
  value,
  onChange,
  onScan,
  placeholder = "Escanea o escribe el código...",
  disabled
}: ScannerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  async function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const codigo = value.trim();
    if (!codigo) return;
    onChange("");
    await onScan(codigo);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <input
      ref={inputRef}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      autoFocus
      inputMode="numeric"
      className="scan-ring w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-950 outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      placeholder={placeholder}
    />
  );
}
