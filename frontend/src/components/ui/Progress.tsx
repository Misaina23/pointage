"use client";

type ProgressProps = {
    value?: number;
    max?: number;
    className?: string;
    label?: string;
};

export function Progress({ value = 0, max = 100, className = "", label }: ProgressProps) {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={`grid gap-1.5 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
            {(label || percent > 0) && (
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--mut)]">
                    <span>{label}</span>
                    {percent > 0 && <span>{Math.round(percent)}%</span>}
                </div>
            )}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--pri2)]">
                <div
                    className="h-full rounded-full bg-[var(--pri)] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
