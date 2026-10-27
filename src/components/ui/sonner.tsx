"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ position = "top-right", ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "#f0fdf4",
          "--success-border": "#bbf7d0",
          "--success-text": "#166534",
          "--error-bg": "#fef2f2",
          "--error-border": "#fecaca",
          "--error-text": "#991b1b",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:shadow-md group-[.toaster]:rounded-xl group-[.toaster]:border font-sans text-sm backdrop-blur-md",
          description: "group-[.toast]:text-xs font-normal",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
          success:
            "!bg-emerald-50 !text-emerald-800 !border-emerald-200 dark:!bg-emerald-950/40 dark:!text-emerald-200 dark:!border-emerald-800/60",
          error:
            "!bg-red-50 !text-red-800 !border-red-200 dark:!bg-red-950/40 dark:!text-red-200 dark:!border-red-800/60",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
