import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

type FeatureCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
};

export function FeatureCard({ title, description, icon, href }: FeatureCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 hover:border-primary">
        <CardHeader className="flex flex-col items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="flex-grow">
            <CardTitle className="text-xl font-bold font-headline">{title}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <div className="w-full flex justify-end mt-2">
            <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
