import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={[
        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
        "focus:border-slate-700 focus:outline-none",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
