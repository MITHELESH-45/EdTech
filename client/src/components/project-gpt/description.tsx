import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Zap, Loader2 } from 'lucide-react';

interface DescriptionProps {
  projectDescription: string;
  onDescriptionChange: (value: string) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export function Description({ projectDescription, onDescriptionChange, onAnalyze, isAnalyzing = false }: DescriptionProps) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-foreground">Describe Your Project</h2>
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          value={projectDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your IoT or robotics project in detail...."
          className="min-h-[100px] resize-y text-base mb-4"
        />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            AI can make mistakes. Please verify before use.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!projectDescription.trim() || isAnalyzing}
            onClick={onAnalyze}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Project Analysis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

