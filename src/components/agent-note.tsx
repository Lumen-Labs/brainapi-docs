import { Callout } from "fumadocs-ui/components/callout";
import type { ReactNode } from "react";
import { BotIcon } from "lucide-react";

export function AgentNote({ children }: { children: ReactNode }) {
  return (
    <Callout
      title="For agents"
      type="info"
      icon={<BotIcon className="size-4" />}
      className="border-dashed"
    >
      <div className="prose-no-margin text-sm [&_ul]:my-2 [&_p]:my-1">
        {children}
      </div>
    </Callout>
  );
}

export function LlmsPointer() {
  return (
    <p className="sr-only" data-agent-index>
      For the complete BrainAPI documentation index, see{" "}
      <a href="/docs/llms.txt">llms.txt</a>. A markdown version of any docs page
      is available by appending <code>.md</code> to its URL. Docs MCP:{" "}
      <a href="/docs/mcp">/docs/mcp</a>.
    </p>
  );
}
