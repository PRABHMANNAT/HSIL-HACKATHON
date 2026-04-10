"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export function CopilotMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("copilot-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ className, ...props }) => <h1 className={cn("mt-4 text-xl font-semibold text-white", className)} {...props} />,
          h2: ({ className, ...props }) => <h2 className={cn("mt-4 text-lg font-semibold text-white", className)} {...props} />,
          h3: ({ className, ...props }) => <h3 className={cn("mt-3 text-base font-semibold text-white", className)} {...props} />,
          p: ({ className, ...props }) => <p className={cn("leading-7 text-slate-200", className)} {...props} />,
          ul: ({ className, ...props }) => <ul className={cn("my-3 list-disc space-y-2 pl-5 text-slate-200", className)} {...props} />,
          ol: ({ className, ...props }) => <ol className={cn("my-3 list-decimal space-y-2 pl-5 text-slate-200", className)} {...props} />,
          table: ({ className, ...props }) => (
            <div className="my-4 overflow-hidden rounded-2xl border border-white/10">
              <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
            </div>
          ),
          thead: ({ className, ...props }) => <thead className={cn("bg-white/6 text-slate-100", className)} {...props} />,
          th: ({ className, ...props }) => <th className={cn("border-b border-white/10 px-3 py-2 font-medium", className)} {...props} />,
          td: ({ className, ...props }) => <td className={cn("border-t border-white/6 px-3 py-2 text-slate-200", className)} {...props} />,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");

            if (!isBlock) {
              return (
                <code
                  className={cn(
                    "rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[0.92em] text-cyan-100",
                    className,
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code className={cn("block overflow-x-auto font-mono text-[13px]", className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ className, ...props }) => (
            <pre
              className={cn(
                "my-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#07101d] p-4 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                className,
              )}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
