import React, { useEffect } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";

export const cn = (...a) => twMerge(clsx(...a));

export function Button({ variant = "primary", size = "md", className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        {
          primary: "bg-primary text-primary-foreground hover:opacity-90",
          outline: "border border-input bg-card hover:bg-muted",
          ghost: "hover:bg-muted",
          danger: "bg-destructive text-destructive-foreground hover:opacity-90",
        }[variant],
        { sm: "h-9 px-3 text-sm", md: "h-10 px-4 text-sm", icon: "h-9 w-9", iconSm: "h-8 w-8" }[size],
        className
      )}
      {...props}
    />
  );
}

const field = "w-full rounded-lg border border-input bg-card px-3 h-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";

export const Input = ({ className, ...p }) => <input className={cn(field, className)} {...p} />;
export const Textarea = ({ className, ...p }) => <textarea className={cn(field, "h-auto py-2", className)} {...p} />;
export function Select({ className, children, ...p }) {
  return <select className={cn(field, "select-chevron pr-8", className)} {...p}>{children}</select>;
}

export function Field({ label, children, className }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Badge({ className, children }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>{children}</span>;
}

export function Card({ className, children }) {
  return <div className={cn("bg-card rounded-2xl border border-border p-5", className)}>{children}</div>;
}

export function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl p-5 pb-safe">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tancar"><X className="w-4 h-4" /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Empty({ icon: Icon, text, action }) {
  return (
    <div className="text-center py-16 bg-card rounded-2xl border border-border">
      {Icon && <Icon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />}
      <p className="text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const confirmDelete = (what) => window.confirm(`Segur que vols eliminar ${what}? Aquesta acció no es pot desfer.`);
