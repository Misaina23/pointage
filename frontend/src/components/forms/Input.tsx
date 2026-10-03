"use client";

import { useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
};

export function Field({
    label,
    error,
    hint,
    required,
    children,
}: FieldProps & { children: React.ReactNode }) {
    return (
        <label className="form-stack">
            <span className="field-label">
                {label}
                {required && <span aria-hidden> *</span>}
            </span>
            {children}
            {hint && !error && <small className="form-note">{hint}</small>}
            {error && <small className="form-error">{error}</small>}
        </label>
    );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps;

export function Input({ label, error, hint, required, className = "", ...rest }: InputProps) {
    const id = useId();

    return (
        <Field label={label} error={error} hint={hint} required={required}>
            <input id={id} className={`form-control ${className}`} aria-invalid={!!error} {...rest} />
        </Field>
    );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export function Textarea({ label, error, hint, required, className = "", ...rest }: TextareaProps) {
    return (
        <Field label={label} error={error} hint={hint} required={required}>
            <textarea
                className={`form-control textarea-control ${className}`}
                aria-invalid={!!error}
                {...rest}
            />
        </Field>
    );
}

export type SelectOption = {
    value: string;
    label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
    FieldProps & { options: SelectOption[]; placeholder?: string };

export function Select({
    label,
    error,
    hint,
    required,
    options,
    placeholder,
    className = "",
    ...rest
}: SelectProps) {
    return (
        <Field label={label} error={error} hint={hint} required={required}>
            <select className={`form-control ${className}`} aria-invalid={!!error} {...rest}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

export function DatePicker(
    props: Omit<InputProps, "type"> & { type?: "date" | "time" | "datetime-local" | "month" },
) {
    const { label, type = "date", ...rest } = props;

    return <Input type={type} label={label} {...rest} />;
}

export function TimePicker(props: Omit<InputProps, "type"> & { type?: "time" }) {
    const { label, ...rest } = props;

    return <Input type={props.type ?? "time"} label={label} {...rest} />;
}

export function FileUpload({
    label,
    error,
    hint,
    accept = "application/pdf,image/png,image/jpeg",
    onChange,
}: FieldProps & {
    accept?: string;
    onChange: (file: File | null) => void;
}) {
    return (
        <Field label={label} error={error} hint={hint}>
            <input
                type="file"
                accept={accept}
                className="file-upload"
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            />
        </Field>
    );
}

export function SearchInput({
    value,
    onChange,
    placeholder = "Rechercher…",
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="search-box">
            <input
                type="search"
                className="form-control"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

export function FilterRow({ children }: { children: React.ReactNode }) {
    return <div className="filter-row">{children}</div>;
}