import { BarChart2 } from "lucide-react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col mb-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4" />
        <h1 className="font-bold text-2xl">{title}</h1>
      </div>
      {subtitle && (
        <p className="text-neutral-500 text-sm text-balance max-w-[50ch]">
          {subtitle}
        </p>
      )}
    </div>
  );
};
