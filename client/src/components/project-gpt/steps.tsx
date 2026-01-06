import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, CheckCircle2 } from 'lucide-react';

interface Step {
  instruction: string;
  subSteps?: string[];
}

interface StepsProps {
  steps?: Step[];
}

export function Steps({ steps = [] }: StepsProps) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-foreground">Step-by-Step Instructions</h2>
          {steps.length > 0 && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>

        {/* Steps List */}
        {steps.length === 0 ? (
          <p className="text-muted-foreground">
            Step-by-step instructions will appear here after you submit your project description.
          </p>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {/* Step Number Circle */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                
                {/* Step Content */}
                <div className="flex-1">
                  <p className="text-foreground mb-2">{step.instruction}</p>
                  
                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="ml-0 mt-2 space-y-1">
                      {step.subSteps.map((subStep, subIndex) => (
                        <p key={subIndex} className="text-sm text-muted-foreground">
                          {subStep}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

