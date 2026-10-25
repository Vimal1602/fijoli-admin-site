import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminDetailDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          className ??
          "flex max-h-[min(92dvh,880px)] w-[min(96vw,32rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        }
      >
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-base leading-snug sm:text-lg">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">{children}</div>
        {footer ? <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
