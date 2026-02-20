"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownMenu = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, any>(({ children, asChild, className, ...props }, ref) => (
  <button ref={ref} className={className} {...props}>{children}</button>
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<HTMLDivElement, any>(({ children, className, align, ...props }, ref) => (
  <div ref={ref} className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)} {...props}>{children}</div>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground", className)} {...props}>{children}</div>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
  <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props}>{children}</div>
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel };
