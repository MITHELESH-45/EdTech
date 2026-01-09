import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Code, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface CodingQuestion {
  id: string;
  component: string;
  title: string;
  description: string;
  testcases: Array<{ input: string; expectedOutput: string }>;
}

interface CodingComponent {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function CodingComponent() {
  const [, params] = useRoute("/coding-playground/:component");
  const componentId = params?.component || "";
  const [component, setComponent] = useState<CodingComponent | null>(null);
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [componentRes, questionsRes] = await Promise.all([
          fetch(`/api/coding/components`),
          fetch(`/api/coding/components/${componentId}/questions`),
        ]);

        if (componentRes.ok) {
          const components = await componentRes.json();
          const found = components.find((c: CodingComponent) => c.id === componentId);
          setComponent(found || null);
        }

        if (questionsRes.ok) {
          const data = await questionsRes.json();
          setQuestions(data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (componentId) {
      fetchData();
    }
  }, [componentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!component) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <h2 className="text-2xl font-bold">Component Not Found</h2>
        <p className="text-muted-foreground">The component you're looking for doesn't exist.</p>
        <Link href="/coding-playground">
          <Button>Back to Playground</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link href="/coding-playground">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{component.name}</h1>
            <p className="text-muted-foreground pt-2">{component.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Questions Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <Card className="h-full flex flex-col hover:border-primary/60 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    Question {index + 1}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {question.testcases.length} Testcases
                  </Badge>
                </div>
                <CardTitle className="text-lg">{question.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {question.description}
                </p>
                <Link href={`/code-editor?questionId=${question.id}`}>
                  <Button className="w-full gap-2" size="sm">
                    <Code className="h-4 w-4" />
                    Open in Code Editor
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {questions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No questions available for this component.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

