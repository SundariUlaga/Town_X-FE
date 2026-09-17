import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content?: string | null;
  className?: string;
  emptyFallback?: string;
};

/** Renders user/admin-authored markdown (headings, lists, bold, links) safely. */
export function MarkdownContent({
  content,
  className,
  emptyFallback = "No description provided.",
}: MarkdownContentProps) {
  const text = content?.trim();
  if (!text) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyFallback}</p>;
  }

  return (
    <div
      className={cn(
        "markdown-body text-sm md:text-base leading-relaxed text-foreground",
        "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
        "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-foreground",
        "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground",
        "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold",
        "[&_p]:my-2 [&_p]:text-muted-foreground",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1",
        "[&_li]:text-muted-foreground",
        "[&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline-offset-2 hover:[&_a]:underline",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_hr]:my-4 [&_hr]:border-border",
        "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownContent;
