import Anthropic from "@anthropic-ai/sdk";

const baseSystemPrompt =
  "You are MedDevice Suite Pro's AI copilot, an expert in medical device design, IEC 60601-1, ISO 14971, FDA 510(k) submissions, cardiac device engineering, and regulatory compliance. You have access to the current project context provided. Be precise, reference specific standards clauses when relevant, and always consider patient safety implications.";

type CopilotRequest = {
  model?: string;
  currentPage?: string;
  context?: Array<{
    title: string;
    summary?: string;
    content: string;
  }>;
  messages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Anthropic API key is not configured. Set ANTHROPIC_API_KEY and retry." },
      { status: 503 },
    );
  }

  let payload: CopilotRequest;

  try {
    payload = (await request.json()) as CopilotRequest;
  } catch {
    return Response.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!payload.messages?.length) {
    return Response.json({ error: "At least one message is required." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = payload.model === "claude-opus-4-20250514" ? payload.model : "claude-sonnet-4-20250514";
  const attachedContext =
    payload.context?.length
      ? payload.context
          .map(
            (item, index) =>
              `Context ${index + 1}: ${item.title}\nSummary: ${item.summary ?? "No summary provided"}\nDetails:\n${item.content}`,
          )
          .join("\n\n")
      : "No additional project context was attached.";

  const system = `${baseSystemPrompt}

Current workspace route: ${payload.currentPage ?? "/copilot"}

Attached project context:
${attachedContext}`;

  const encoder = new TextEncoder();

  try {
    const stream = await client.messages.create({
      model,
      system,
      max_tokens: 1400,
      temperature: 0.35,
      stream: true,
      messages: payload.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The copilot service could not complete the request.";
    return Response.json({ error: message }, { status: 500 });
  }
}
