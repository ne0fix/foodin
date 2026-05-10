'use client';
import { useRef, KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  erro?: string;
}

export function PinInput({ value, onChange, label, erro }: Props) {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
                useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const digits = value.padEnd(4, ' ').split('').slice(0, 4);

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const novo = digits.map((d, j) => j === i ? v : d).join('').replace(/\s/g, '');
    onChange(novo);
    if (v && i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) refs[i - 1].current?.focus();
  };

  return (
    <div>
      {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}
      <div className="flex gap-3">
        {[0, 1, 2, 3].map(i => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] === ' ' ? '' : digits[i]}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none
              transition-colors ${erro ? 'border-red-400' : 'border-gray-300 focus:border-green-500'}`}
          />
        ))}
      </div>
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  );
}
