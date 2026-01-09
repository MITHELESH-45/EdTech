import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TestcaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
}

interface TestcaseResultsProps {
  results: TestcaseResult[];
  passedCount: number;
  totalCount: number;
}

export function TestcaseResults({ results, passedCount, totalCount }: TestcaseResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Testcase Results</CardTitle>
          <Badge
            variant={passedCount === totalCount ? "default" : "destructive"}
            className={cn(
              passedCount === totalCount
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            )}
          >
            {passedCount} / {totalCount} Passed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.map((result, index) => (
          <div
            key={index}
            className={cn(
              "border rounded-lg p-3 transition-colors",
              result.passed
                ? "border-green-500/50 bg-green-500/5"
                : "border-red-500/50 bg-red-500/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Testcase {index + 1}</span>
                <Badge
                  variant={result.passed ? "default" : "destructive"}
                  className={cn(
                    result.passed
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  )}
                >
                  {result.passed ? "Passed" : "Failed"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand(index)}
                className="h-8 w-8 p-0"
              >
                {expandedIndex === index ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {expandedIndex === index && (
              <div className="mt-3 space-y-2 pt-3 border-t">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    Input:
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded font-mono whitespace-pre-wrap">
                    {result.input || "(empty)"}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    Expected Output:
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded font-mono whitespace-pre-wrap">
                    {result.expectedOutput}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    Your Output:
                  </div>
                  <pre
                    className={cn(
                      "text-xs bg-muted p-2 rounded font-mono whitespace-pre-wrap",
                      !result.passed && "text-red-600 dark:text-red-400"
                    )}
                  >
                    {result.actualOutput || "(no output)"}
                  </pre>
                </div>
                {result.error && (
                  <div>
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                      Error:
                    </div>
                    <pre className="text-xs bg-red-500/10 border border-red-500/20 p-2 rounded font-mono whitespace-pre-wrap text-red-600 dark:text-red-400">
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

