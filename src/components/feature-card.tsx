"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  href,
  className,
}: FeatureCardProps) {
  const Content = () => (
    <div
      className={cn(
        "group rounded-xl border border-sidebar-border p-5 transition-all bg-background hover:bg-sidebar-accent cursor-pointer",
        "hover:shadow-md hover:border-sidebar-accent",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-sidebar border border-sidebar-border text-sidebar-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground transition-colors">
          {icon}
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      <Content />
    </Link>
  ) : (
    <Content />
  );
}
