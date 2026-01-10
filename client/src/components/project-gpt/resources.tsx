import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, CheckCircle2 } from 'lucide-react';

interface Resource {
  name: string;
  description: string;
}

interface ResourcesProps {
  resources?: Resource[];
}

export function Resources({ resources = [] }: ResourcesProps) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Wrench className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-foreground">Project Resources</h2>
          {resources.length > 0 && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>

        {/* Resources List */}
        {resources.length === 0 ? (
          <p className="text-muted-foreground">
            Required components and resources will appear here after you submit your project description.
          </p>
        ) : (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-semibold text-foreground mb-2">{resource.name}</h3>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

