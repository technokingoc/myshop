"use client";

import * as React from "react";

const Select = ({ children, value, onValueChange, ...props }: any) => {
  return <div data-value={value} {...props}>{React.Children.map(children, (child: any) => 
    child ? React.cloneElement(child, { value, onValueChange }) : null
  )}</div>;
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(({ children, className, ...props }, ref) => (
  <button ref={ref} className={className} {...props}>{children}</button>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;

const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;

const SelectItem = React.forwardRef<HTMLDivElement, any>(({ children, value, ...props }, ref) => (
  <div ref={ref} data-value={value} {...props}>{children}</div>
));
SelectItem.displayName = "SelectItem";

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
