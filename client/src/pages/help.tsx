import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Mail, MessageSquare, Send, CheckCircle, ArrowRight, BookOpen, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Help() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactForm) => {
    setIsSubmitting(true);
    setTimeout(() => {
      console.log("Contact form submitted:", data);
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: "Message sent",
        description: "We've received your message and will get back to you soon.",
      });
    }, 1000);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    form.reset();
  };

  return (
    <div className="flex flex-1">
        <ToolSidebar />

        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
          <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="heading-help">
                <HelpCircle className="h-8 w-8 text-primary" />
                Help & Support
              </h1>
              <p className="text-muted-foreground text-lg">
                Have questions or need assistance? We're here to help you succeed.
              </p>
            </motion.div>

            {/* Support Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid gap-6 md:grid-cols-3 mb-8"
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">FAQ</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Find answers to commonly asked questions and get instant help
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-chart-4" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Email Support</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get personalized help via email within 24 hours
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-chart-4">
                    <Clock className="h-3 w-3" />
                    <span>24h response time</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-chart-1/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-chart-1" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Community</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Connect with other learners and share knowledge
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Quick answers to common questions
                  </CardDescription>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>How do I get started with E-GROOTS?</AccordionTrigger>
                      <AccordionContent>
                        Getting started is easy! Simply create an account, explore the dashboard, and choose a course that interests you. You can start with our beginner-friendly courses and work your way up to more advanced topics.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>What programming languages are supported?</AccordionTrigger>
                      <AccordionContent>
                        Our coding playground supports Python, JavaScript, C++, and Java. You can write, run, and test your code directly in the browser with full error reporting and output display.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>How does the GROOT AI assistant work?</AccordionTrigger>
                      <AccordionContent>
                        GROOT is our built-in AI assistant that helps you learn and debug. You can access it from the header to ask questions about electronics and IoT, or use it in the coding playground to get explanations for errors and code suggestions.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Can I use the simulators without an account?</AccordionTrigger>
                      <AccordionContent>
                        While you can explore some features without an account, we recommend creating a free account to save your progress, track your learning, and access all features including personalized course recommendations.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-5">
                      <AccordionTrigger>Is my data secure?</AccordionTrigger>
                      <AccordionContent>
                        Yes, we take your privacy seriously. All data is encrypted, and we use secure authentication. The GROOT AI assistant uses a secure OpenAI API key configured on our server, ensuring your conversations remain private.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Contact Us</CardTitle>
                  </div>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible. We typically respond within 24 hours.
                  </CardDescription>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent>
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 rounded-full bg-chart-4/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-chart-4" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">Message Sent Successfully!</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Thank you for reaching out. We've received your message and will respond to your inquiry within 24 hours.
                      </p>
                      <Button variant="outline" onClick={handleReset} data-testid="button-send-another" className="group">
                        Send Another Message
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your name"
                                    data-testid="input-contact-name"
                                    className="h-11"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="you@example.com"
                                    type="email"
                                    data-testid="input-contact-email"
                                    className="h-11"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Subject</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="How can we help?"
                                  data-testid="input-contact-subject"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your question or issue in detail..."
                                  className="min-h-36 resize-none"
                                  data-testid="input-contact-message"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                          <Shield className="h-4 w-4 text-chart-4 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            Your information is secure and will only be used to respond to your inquiry.
                          </p>
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          data-testid="button-submit-contact"
                          className="w-full md:w-auto group"
                          size="lg"
                        >
                          {isSubmitting ? "Sending..." : "Send Message"}
                          <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
    </div>
  );
}
