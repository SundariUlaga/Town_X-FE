import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";

import { accountAPI, type SupportQuestion } from "@/services/accountAPI";
import { getApiErrorMessage } from "@/lib/apiErrors";
import TownLoader from "@/components/shared/TownLoader";
import ContextualEmptyState from "@/components/shared/ContextualEmptyState";
import LoadErrorState from "@/components/shared/LoadErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const questionSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().min(10, "Please provide at least 10 characters").max(5000),
});

type QuestionValues = z.infer<typeof questionSchema>;

function statusVariant(status: SupportQuestion["status"]) {
  if (status === "answered") return "default" as const;
  if (status === "closed") return "secondary" as const;
  return "outline" as const;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QuestionsPage() {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    data: questions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["account", "questions"],
    queryFn: accountAPI.getQuestions,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: { subject: "", message: "" },
  });

  useEffect(() => {
    if (!submitSuccess) return;
    const timer = window.setTimeout(() => setSubmitSuccess(null), 4000);
    return () => window.clearTimeout(timer);
  }, [submitSuccess]);

  const onSubmit = async (values: QuestionValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await accountAPI.submitQuestion({
        subject: values.subject.trim(),
        message: values.message.trim(),
      });
      reset();
      setSubmitSuccess("Your question has been submitted. We'll get back to you soon.");
      await queryClient.invalidateQueries({ queryKey: ["account", "questions"] });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Could not submit your question"));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="size-5" />
            Ask a question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Listing visibility, account help"
                {...register("subject")}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Your question</Label>
              <textarea
                id="message"
                rows={5}
                placeholder="Describe your question in detail…"
                className="flex w-full rounded-control border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("message")}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message.message}</p>
              )}
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            {submitSuccess && <p className="text-sm text-emerald-700">{submitSuccess}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit question"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="size-5" />
            Your questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <TownLoader label="Loading questions" />}
          {isError && (
            <LoadErrorState
              message={getApiErrorMessage(error, "Could not load your questions")}
              onRetry={() => refetch()}
            />
          )}
          {!isLoading && !isError && questions?.length === 0 && (
            <ContextualEmptyState
              title="No questions yet"
              description="Ask our support team anything about listings, account, or verification."
              actionLabel="Ask a question"
              onAction={() => document.getElementById("subject")?.focus()}
              className="shadow-none border-0 py-6"
            />
          )}
          {!isLoading && !isError && questions && questions.length > 0 && (
            <div className="space-y-4">
              {questions.map((q) => (
                <article
                  key={q.id}
                  className="rounded-control border border-border p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground">{q.subject}</h3>
                    <Badge variant={statusVariant(q.status)} className="capitalize shrink-0">
                      {q.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.message}</p>
                  <p className="text-xs text-muted-foreground">Submitted {formatDate(q.created_at)}</p>
                  {q.admin_reply && (
                    <div className="rounded-md bg-muted/60 p-3 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Support reply
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{q.admin_reply}</p>
                      {q.answered_at && (
                        <p className="text-xs text-muted-foreground">
                          Answered {formatDate(q.answered_at)}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
