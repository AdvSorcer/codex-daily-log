import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...props }: Props) {
  return (
    <textarea
      className={[
        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
        "focus:border-slate-700 focus:outline-none",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
