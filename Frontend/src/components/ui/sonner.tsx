
// import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  // const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-5 text-blue-500" />
        ),
        info: (
          <InfoIcon className="size-5 text-blue-500" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 text-amber-500" />
        ),
        error: (
          <OctagonXIcon className="size-5 text-red-500" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin text-blue-500" />
        ),
      }}
      style={
        {
          "--normal-bg": "#FFFFFF",
          "--normal-text": "#1E293B",
          "--normal-border": "#DBEAFE",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !bg-white !text-slate-800 !border !border-blue-100 !rounded-xl !shadow-md",
          title: "!text-slate-800 font-medium",
          description: "!text-slate-500",
          success: "!border-blue-200",
          error: "!border-red-200",
          closeButton:
            "!bg-white !text-slate-500 !border-blue-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
