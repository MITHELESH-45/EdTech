import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code as CodeIcon, CheckCircle2, Copy, Check } from 'lucide-react';

interface CodeProps {
  code?: string;
  language?: string;
}

export function Code({ code, language = 'cpp' }: CodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <CodeIcon className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-foreground">Code Implementation</h2>
          {code && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>

        {/* Code Editor Area */}
        {!code ? (
          <p className="text-muted-foreground">
            Ready-to-use code will appear here after you submit your project description.
          </p>
        ) : (
          <div className="relative">
            {/* Copy Button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="bg-background/80 backdrop-blur-sm border-border hover:bg-background"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Code Block */}
            <div className="relative bg-[#1e1e1e] rounded-lg border border-border overflow-hidden">
              <pre className="p-6 text-sm font-mono text-[#d4d4d4] overflow-x-auto">
                <code className="language-cpp">{code}</code>
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

