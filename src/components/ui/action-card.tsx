"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  href: string;
  external?: boolean;
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon,
  href,
  external = false,
  className,
}: ActionCardProps) {
  const content = (
    <div
      className={cn(
        "group block rounded-lg border bg-white p-6 text-center transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      <div className="flex justify-center text-blue-600 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}