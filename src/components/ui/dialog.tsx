"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onPointerDownOutside?: (event: Event) => void;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

const Dialog = ({ open = false, onOpenChange = () => {}, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ children, asChild = false }: DialogTriggerProps) => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used within Dialog");

  const handleClick = () => {
    context.onOpenChange(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};

const DialogContent = ({ 
  children, 
  className,
  onPointerDownOutside,
  ...props 
}: DialogContentProps) => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogContent must be used within Dialog");

  if (!context.open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      context.onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0" 
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "relative bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto",
          className
        )}
        {...props}
      >
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
          onClick={() => context.onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children, className, ...props }: DialogHeaderProps) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-4", className)}
    {...props}
  >
    {children}
  </div>
);

const DialogTitle = ({ children, className, ...props }: DialogTitleProps) => (
  <h2 
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h2>
);

const DialogDescription = ({ children, className, ...props }: DialogDescriptionProps) => (
  <p className={cn("text-sm text-slate-500", className)} {...props}>
    {children}
  </p>
);

const DialogFooter = ({ children, className, ...props }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4", className)}
    {...props}
  >
    {children}
  </div>
);

export {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
};