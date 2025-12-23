import type React from "react";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement>;

export const Container: React.FC<PropsWithChildren<Props>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn("flex flex-col p-4 md:p-6 w-full h-full", className)}
      {...props}
    >
      {children}
    </div>
  );
};
