"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCheck,
  Clipboard,
  Paperclip,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CopilotMarkdown } from "@/components/copilot/copilot-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  copilotArtifacts,
  copilotModelOptions,
  defaultCopilotContextIds,
  getCopilotArtifacts,
  getCopilotTokenEstimate,
} from "@/lib/copilot";
import { cn } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  modelLabel?: string;
  isStreaming?: boolean;
  feedback?: "up" | "down" | null;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

const panelClass =
  "rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,30,0.96),rgba(5,10,20,0.92))] shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl";

const emptyPrompts = [
  "Generate FMEA for current design",
  "Find gaps in my requirements against IEC 60601-1",
  "Explain the risk associated with single-supply voltage design",
  "Draft a biocompatibility rationale for titanium housing",
  "Generate test cases for REQ-012",
];

function formatClock(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CopilotWorkbench() {
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [attachedContextIds, setAttachedContextIds] = React.useState<string[]>(defaultCopilotContextIds);
  const [attachDialogOpen, setAttachDialogOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<(typeof copilotModelOptions)[number]["id"]>(
    "claude-sonnet-4-20250514",
  );
  const [isSending, setIsSending] = React.useState(false);
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);
  const [recognizing, setRecognizing] = React.useState(false);
  const scrollAnchorRef = React.useRef<HTMLDivElement | null>(null);

  const attachedArtifacts = React.useMemo(
    () => getCopilotArtifacts(attachedContextIds),
    [attachedContextIds],
  );
  const tokenEstimate = getCopilotTokenEstimate(attachedContextIds);
  const selectedModelLabel =
    copilotModelOptions.find((option) => option.id === selectedModel)?.label ?? "Claude Sonnet 4";

  React.useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function toggleContext(id: string) {
    setAttachedContextIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function handleCopy(content: string, messageId: string) {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    toast.success("Response copied");
    window.setTimeout(() => setCopiedMessageId((current) => (current === messageId ? null : current)), 1200);
  }

  function exportConversation() {
    const exportText = messages
      .map((message) => {
        const label = message.role === "assistant" ? message.modelLabel ?? "Claude Sonnet 4" : "User";
        return `## ${label} • ${formatClock(message.createdAt)}\n\n${message.content}\n`;
      })
      .join("\n");

    const blob = new Blob([exportText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "copilot-conversation.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function setFeedback(id: string, value: "up" | "down") {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, feedback: value } : message)));
    toast.success(value === "up" ? "Positive feedback saved" : "Feedback noted for follow-up");
  }

  function applyToProject(message: ThreadMessage) {
    toast.success(`Applied ${message.modelLabel ?? "Claude"} draft to current project notes`);
  }

  function startVoiceInput() {
    const SpeechRecognitionApi =
      typeof window !== "undefined"
        ? (window as typeof window & {
            SpeechRecognition?: new () => BrowserSpeechRecognition;
            webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
          }).SpeechRecognition ||
          (window as typeof window & {
            webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
          }).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionApi) {
      toast.error("Voice input is not available in this browser");
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setRecognizing(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setDraft((current) => (current ? `${current}\n${transcript}` : transcript));
      toast.success("Voice input added to draft");
    };
    recognition.onerror = () => toast.error("Voice input failed. Try again.");
    recognition.onend = () => setRecognizing(false);
    recognition.start();
  }

  async function sendMessage(prompt = draft.trim()) {
    if (!prompt || isSending) {
      return;
    }

    const now = new Date().toISOString();
    const userMessage: ThreadMessage = {
      id: makeId("user"),
      role: "user",
      content: prompt,
      createdAt: now,
    };
    const assistantId = makeId("assistant");
    const assistantMessage: ThreadMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      modelLabel: selectedModelLabel,
      isStreaming: true,
      feedback: null,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          currentPage: "/copilot",
          context: attachedArtifacts,
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "The copilot request could not be completed.");
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
          current.map((message) =>
            message.id === assistantId ? { ...message, content: combined, isStreaming: true } : message,
          ),
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: combined.trim(), isStreaming: false } : message,
        ),
      );
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unexpected copilot failure";
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: `### Copilot unavailable\n\n${description}\n\nCheck the Anthropic API key and try again.`,
                isStreaming: false,
              }
            : message,
        ),
      );
      toast.error(description);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className={cn(panelClass, "flex min-h-[calc(100vh-9.5rem)] flex-col overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
                <Bot className="size-3.5" />
                Claude-powered copilot
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Ask the project what matters.</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Use the current requirements, design, simulation, and compliance context to generate grounded medical
                device guidance with standards-aware reasoning.
              </p>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <Badge className="bg-white/10 text-slate-100">{selectedModelLabel}</Badge>
              <Badge className="bg-cyan-500/12 text-cyan-100">~{tokenEstimate.toLocaleString()} tokens attached</Badge>
            </div>
          </div>

          <ScrollArea className="flex-1 px-6 py-6">
            {messages.length === 0 ? (
              <div className="grid min-h-[420px] place-items-center">
                <div className="w-full max-w-4xl space-y-6">
                  <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8">
                    <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                      <Sparkles className="size-4" />
                      Ready for regulatory, risk, and systems design work
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {emptyPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt)}
                          className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-left text-sm text-slate-100 transition hover:bg-white/10"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[88%] rounded-[28px] px-5 py-4 sm:max-w-[78%]",
                          message.role === "user"
                            ? "bg-[linear-gradient(135deg,#1673ff,#0a84ff)] text-white shadow-[0_20px_50px_rgba(10,132,255,0.26)]"
                            : "border border-white/8 border-l-cyan-400/70 bg-[linear-gradient(180deg,rgba(8,15,27,0.95),rgba(6,10,18,0.92))] shadow-[0_24px_60px_rgba(0,0,0,0.22)]",
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className={cn(message.role === "user" && "text-blue-100/85")}>
                              {message.role === "assistant" ? message.modelLabel : "You"}
                            </span>
                            <span className={cn(message.role === "user" && "text-blue-100/65")}>
                              {formatClock(message.createdAt)}
                            </span>
                          </div>
                        </div>

                        {message.role === "assistant" ? (
                          <div className="space-y-4">
                            <CopilotMarkdown content={message.content || "Thinking..."} />
                            {message.isStreaming ? (
                              <div className="inline-flex items-center gap-2 text-xs text-cyan-200">
                                <span className="size-2 rounded-full bg-cyan-300 animate-pulse" />
                                Streaming response
                              </div>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-200 hover:bg-white/8"
                                onClick={() => void handleCopy(message.content, message.id)}
                              >
                                {copiedMessageId === message.id ? <CheckCheck className="size-4" /> : <Clipboard className="size-4" />}
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-slate-200 hover:bg-white/8", message.feedback === "up" && "bg-white/8")}
                                onClick={() => setFeedback(message.id, "up")}
                              >
                                <ThumbsUp className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-slate-200 hover:bg-white/8", message.feedback === "down" && "bg-white/8")}
                                onClick={() => setFeedback(message.id, "down")}
                              >
                                <ThumbsDown className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-cyan-100 hover:bg-cyan-500/12"
                                onClick={() => applyToProject(message)}
                              >
                                <Wand2 className="size-4" />
                                Apply to Project
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 whitespace-pre-wrap text-sm leading-7 text-white">{message.content}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={scrollAnchorRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-50"
                >
                  {artifact.title}
                  <button type="button" onClick={() => toggleContext(artifact.id)} className="text-cyan-100/70 hover:text-white">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Claude about risks, standards gaps, simulations, or regulatory evidence..."
              className="min-h-[124px] border-white/10 bg-slate-950/50 text-slate-100 placeholder:text-slate-500"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => setAttachDialogOpen(true)}
                >
                  <Paperclip className="size-4" />
                  Attach context
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={startVoiceInput}
                >
                  <Volume2 className="size-4" />
                  {recognizing ? "Listening..." : "Voice input"}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => setMessages([])}
                >
                  <Trash2 className="size-4" />
                  Clear chat
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={exportConversation}
                  disabled={messages.length === 0}
                >
                  <Clipboard className="size-4" />
                  Export conversation
                </Button>
              </div>
              <Button
                className="bg-white text-slate-950 hover:bg-slate-100"
                onClick={() => void sendMessage()}
                disabled={isSending || !draft.trim()}
              >
                {isSending ? "Streaming..." : "Send to Claude"}
              </Button>
            </div>
          </div>
        </section>

        <aside className={cn(panelClass, "h-fit p-5")}>
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Context panel</div>
              <h2 className="mt-2 text-xl font-semibold text-white">What Claude knows about this session</h2>
            </div>

            <div className="space-y-3">
              {attachedArtifacts.map((artifact) => (
                <div key={artifact.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{artifact.title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">{artifact.summary}</div>
                    </div>
                    <button type="button" onClick={() => toggleContext(artifact.id)} className="text-slate-500 hover:text-white">
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              onClick={() => setAttachDialogOpen(true)}
            >
              <Paperclip className="size-4" />
              Attach More
            </Button>

            <div className="rounded-[24px] border border-cyan-400/16 bg-cyan-500/8 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">Context token meter</div>
              <div className="mt-3 text-2xl font-semibold text-white">~{tokenEstimate.toLocaleString()}</div>
              <div className="mt-2 text-sm text-cyan-50/85">tokens of context attached</div>
            </div>

            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Model selector</div>
              <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as typeof selectedModel)}>
                <SelectTrigger className="border-white/10 bg-white/5 text-slate-100">
                  <SelectValue placeholder="Choose Claude model" />
                </SelectTrigger>
                <SelectContent>
                  {copilotModelOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                {copilotModelOptions.find((option) => option.id === selectedModel)?.detail}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={attachDialogOpen} onOpenChange={setAttachDialogOpen}>
        <DialogContent className="max-w-3xl border-white/10 bg-[#08111f] p-0 text-slate-100">
          <DialogHeader className="border-b border-white/10 p-6">
            <DialogTitle>Attach platform artifacts</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add or remove project artifacts that should be included in the Claude system context.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] px-6 py-5">
            <div className="grid gap-3 md:grid-cols-2">
              {copilotArtifacts.map((artifact) => {
                const selected = attachedContextIds.includes(artifact.id);
                return (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => toggleContext(artifact.id)}
                    className={cn(
                      "rounded-[24px] border p-4 text-left transition-all",
                      selected
                        ? "border-cyan-400/35 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/8",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-white">{artifact.title}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-300">{artifact.summary}</div>
                      </div>
                      <Badge className={selected ? "bg-cyan-500/15 text-cyan-100" : "bg-white/10 text-slate-300"}>
                        {artifact.tokens.toLocaleString()} tokens
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
