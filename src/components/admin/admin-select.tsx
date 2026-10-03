"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMPTY_VALUE_PREFIX = "__admin_select_empty__";

export type AdminSelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type AdminSelectProps = {
  name?: string;
  options: AdminSelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "false" | "true";
};

function getEmptyValue(options: AdminSelectOption[]) {
  let candidate = EMPTY_VALUE_PREFIX;
  while (options.some((option) => option.value === candidate)) {
    candidate += "_";
  }
  return candidate;
}

function toItemValue(value: string, emptyValue: string) {
  return value === "" ? emptyValue : value;
}

function toFormValue(value: string, emptyValue: string) {
  return value === emptyValue ? "" : value;
}

export function AdminSelect({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  required = false,
  disabled = false,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}: AdminSelectProps) {
  const emptyValue = getEmptyValue(options);
  const firstOption = options[0];
  const initialValue = defaultValue === undefined ? firstOption?.value ?? "" : defaultValue;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(() => initialValue ?? "");
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value ?? "" : uncontrolledValue;
  const initialValueRef = React.useRef(initialValue ?? "");
  const requiredErrorId = `${React.useId()}-error`;
  const [showRequiredError, setShowRequiredError] = React.useState(false);
  const emptyOption = options.find((option) => option.value === "");
  const triggerPlaceholder = placeholder ?? (typeof emptyOption?.label === "string" ? emptyOption.label : "Pilih opsi");
  const requiredErrorVisible = required && showRequiredError && selectedValue === "";
  const describedBy = [ariaDescribedby, requiredErrorVisible ? requiredErrorId : null].filter(Boolean).join(" ") || undefined;

  const handleValueChange = (nextValue: string) => {
    const nextFormValue = toFormValue(nextValue, emptyValue);
    if (!isControlled) setUncontrolledValue(nextFormValue);
    setShowRequiredError(false);
    onValueChange?.(nextFormValue);
  };

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (isControlled) return;
    const form = triggerRef.current?.form;
    if (!form) return;
    const handleReset = () => {
      window.setTimeout(() => setUncontrolledValue(initialValueRef.current), 0);
    };
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [isControlled]);

  const shouldRenderBridge = Boolean(name || required);

  return (
    <>
      <Select value={selectedValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          ref={triggerRef}
          id={id}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? requiredErrorVisible}
          aria-required={required || undefined}
          className={cn(
            "h-10 w-full min-w-0 rounded-md border-input bg-background text-sm text-foreground shadow-none focus-visible:border-dgb-300 focus-visible:ring-dgb-100",
            "data-[size=default]:h-10",
            "[&>span]:min-w-0 [&>span]:truncate",
            className,
          )}
        >
          <SelectValue placeholder={triggerPlaceholder} />
        </SelectTrigger>
        <SelectContent className="max-w-[min(32rem,calc(100vw-2rem))]">
          {options.map((option) => {
            const itemValue = toItemValue(option.value, emptyValue);
            const isRequiredPlaceholder = required && option.value === "";
            return (
              <SelectItem
                key={itemValue}
                value={itemValue}
                disabled={option.disabled || isRequiredPlaceholder}
              >
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {shouldRenderBridge ? (
        <Input
          className="sr-only !h-px !w-px !min-w-0 !border-0 !p-0"
          type="text"
          name={name}
          value={selectedValue}
          disabled={disabled}
          required={required}
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          aria-invalid={ariaInvalid ?? requiredErrorVisible}
          aria-describedby={describedBy}
          onChange={() => undefined}
          onInvalid={(event) => {
            setShowRequiredError(true);
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        />
      ) : null}
      {requiredErrorVisible ? (
        <span id={requiredErrorId} role="alert" className="mt-1 block text-xs text-destructive">
          Pilihan wajib diisi
        </span>
      ) : null}
    </>
  );
}
