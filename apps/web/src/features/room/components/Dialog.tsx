import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
interface DialogProps {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onClose: () => void;
}
export function Dialog({
  title,
  eyebrow,
  children,
  onClose,
}: DialogProps): React.JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  // Native modal contains focus and makes the background inert.
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="kindred-dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
