"use client";

import { useEffect, useMemo, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type SearchableComboboxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
};

export function SearchableCombobox({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  helperText,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options.slice(0, 20);
    }

    return options
      .filter((option) => {
        const labelText = option.label.toLowerCase();
        const valueText = option.value.toLowerCase();
        return labelText.includes(normalizedQuery) || valueText.includes(normalizedQuery);
      })
      .slice(0, 20);
  }, [options, query]);

  function handleSelect(option: Option) {
    setQuery(option.label);
    onChange(option.value);
    setOpen(false);
  }

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">{label}</span>
      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            onChange(nextValue);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="h-11 w-full rounded-xl border border-[#e7d9cf] bg-white/95 px-3 text-sm"
        />

        {open && !disabled && filteredOptions.length > 0 ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 max-h-56 overflow-auto rounded-2xl border border-input bg-white shadow-xl">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
                className="block w-full border-b border-muted px-3 py-2 text-left text-sm last:border-b-0 hover:bg-primary/5"
              >
                <span className="block font-medium">{option.label}</span>
                {option.value !== option.label ? <span className="block text-xs text-muted-foreground">{option.value}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
    </label>
  );
}