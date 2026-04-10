"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bot, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { defaultCopilotContextIds, getCopilotArtifacts, getCopilotQuickPrompts } from "@/lib/copilot";
import { getPageDefinitionFromPath } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

type MiniMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FloatingCopilot() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [messages, setMessages] = React.useState<MiniMessage[]>([]);
  const [isSending, setIsSending] = React.useState(false);

  if (pathname === "/copilot") {
    return null;
  }

  const prompts = getCopilotQuickPrompts(pathname).slice(0, 3);
  const page = getPageDefinitionFromPath(pathname);
  const context = getCopilotArtifacts(defaultCopilotContextIds);

  async function sendMessage(prompt = draft.trim()) {
    if (!prompt || isSending) {
      return;
    }

    const userMessage: MiniMessage = { id: makeId("user"), role: "user", content: prompt };
    const assistantId = makeId("assistant");
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          currentPage: pathname,
          context,
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const payload = !response.ok ? ((await response.json().catch(() => null)) as { error?: string } | null) : null;
      if (!response.ok || !response.body) {
        throw new Error(payload?.error ?? "Copilot request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let combined = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        combined += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) => (message.id === assistantId ? { ...message, content: combined } : message)),
        );
      }
    } catch (error) {
      const description = error instanceof Error ? error.message : "Copilot request failed.";
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: `Copilot unavailable: ${description}` } : message,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex w-[min(390px,calc(100vw-1.5rem))] flex-col items-end gap-3">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto w-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,27,0.97),rgba(5,10,20,0.95))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Ask AI</div>
                <div className="mt-1 text-xs text-slate-400">{page.label} quick context</div>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-100 hover:bg-white/8" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 grid gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-[20px] border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.length > 0 ? (
              <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
                {messages.slice(-4).map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-[18px] px-3 py-2 text-sm leading-6",
                      message.role === "user"
                        ? "ml-8 bg-[#1673ff] text-white"
                        : "mr-8 border border-white/10 bg-white/6 text-slate-100",
                    )}
                  >
                    {message.content || "Thinking..."}
                  </div>
                ))}
              </div>
            ) : null}

            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Ask about ${page.label.toLowerCase()}...`}
              className="mt-4 min-h-[86px] border-white/10 bg-slate-950/50 text-slate-100 placeholder:text-slate-500"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <Link href="/copilot" className="inline-flex items-center gap-2 text-sm text-cyan-100 hover:text-white">
                Open full copilot
                <ArrowUpRight className="size-4" />
              </Link>
              <Button className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => void sendMessage()} disabled={!draft.trim() || isSending}>
                {isSending ? "Streaming..." : "Send"}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto h-14 rounded-full bg-[linear-gradient(135deg,#16a3ff,#0a84ff)] px-5 text-white shadow-[0_18px_45px_rgba(10,132,255,0.34)] hover:brightness-110"
      >
        <Bot className="mr-2 size-4" />
        Ask AI
        <Sparkles className="ml-2 size-4" />
      </Button>
    </div>
  );
}
