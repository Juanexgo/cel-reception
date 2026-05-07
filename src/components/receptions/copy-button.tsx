"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopy}>
      <Copy className="h-4 w-4" />
      {copied && <span className="sr-only">Copied</span>}
    </Button>
  );
}
