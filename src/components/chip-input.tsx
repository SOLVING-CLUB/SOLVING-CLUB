"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Tags, TextCursorInput } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipInputProps = {
  name: string;
  defaultValue?: string | string[];
  placeholder?: string;
  className?: string;
  allowToggle?: boolean; // show a Chips toggle
  defaultModeChips?: boolean; // start in chips mode
  size?: "sm" | "md";
  onArrayChange?: (values: string[]) => void; // optional callback
  onTextChange?: (value: string) => void; // optional callback for text mode
};

function splitToArray(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ChipInput({
  name,
  defaultValue,
  placeholder,
  className,
  allowToggle = true,
  defaultModeChips = false,
  size = "md",
  onArrayChange,
  onTextChange,
}: ChipInputProps) {
  const initialArray = Array.isArray(defaultValue)
    ? defaultValue
    : typeof defaultValue === "string" && defaultValue.length > 0
    ? splitToArray(defaultValue)
    : [];
  const initialText = Array.isArray(defaultValue)
    ? initialArray.join(", ")
    : (defaultValue as string) || "";

  const [isChips, setIsChips] = React.useState(defaultModeChips);
  const [chips, setChips] = React.useState<string[]>(initialArray);
  const [text, setText] = React.useState<string>(initialText);
  const [draft, setDraft] = React.useState<string>("");

  const lastEmittedRef = React.useRef<string>("");
  React.useEffect(() => {
    const arr = isChips ? chips : splitToArray(text);
    const serialized = JSON.stringify(arr);
    if (serialized !== lastEmittedRef.current) {
      lastEmittedRef.current = serialized;
      onArrayChange?.(arr);
    }
  }, [chips, text, isChips]);

  function addChipFromDraft() {
    const items = splitToArray(draft);
    if (items.length === 0) return;
    const next = Array.from(new Set([...chips, ...items]));
    setChips(next);
    setDraft("");
  }

  function removeChip(idx: number) {
    const next = chips.filter((_, i) => i !== idx);
    setChips(next);
  }

  function toggleMode() {
    if (isChips) {
      // Going to text mode – sync text from chips
      setText(chips.join(", "));
    } else {
      // Going to chips mode – sync chips from text
      setChips(splitToArray(text));
    }
    setIsChips((v) => !v);
  }

  return (
    <div className={className}>
      {allowToggle && (
        <div className="mb-2 flex items-center justify-end">
          <div className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              aria-pressed={!isChips}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full transition",
                !isChips ? "bg-primary text-primary-foreground shadow" : "text-foreground/70 hover:text-foreground"
              )}
              onClick={() => {
                if (isChips) toggleMode()
              }}
            >
              <span className="inline-flex items-center gap-1"><TextCursorInput className="h-3.5 w-3.5" />Text</span>
            </button>
            <button
              type="button"
              aria-pressed={isChips}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full transition",
                isChips ? "bg-primary text-primary-foreground shadow" : "text-foreground/70 hover:text-foreground"
              )}
              onClick={() => {
                if (!isChips) toggleMode()
              }}
            >
              <span className="inline-flex items-center gap-1"><Tags className="h-3.5 w-3.5" />Chips</span>
            </button>
          </div>
        </div>
      )}
      {isChips ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            {chips.length === 0 ? (
              <span className="text-sm text-muted-foreground">No items</span>
            ) : (
              chips.map((c, idx) => (
                <Badge key={`${c}-${idx}`} variant="secondary" className="flex items-center gap-1">
                  <span>{c}</span>
                  <button type="button" onClick={() => removeChip(idx)} aria-label={`Remove ${c}`} className="opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-sm">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <Input
            placeholder={placeholder || "Type and press Enter or ,"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addChipFromDraft();
              } else if (e.key === "Backspace" && draft.length === 0 && chips.length > 0) {
                // quick remove last
                removeChip(chips.length - 1);
              }
            }}
          />
          {/* Submit value for forms */}
          <input type="hidden" name={name} value={chips.join(", ")} readOnly />
        </div>
      ) : (
        <Input
          name={name}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onTextChange?.(e.target.value)
          }}
        />
      )}
    </div>
  );
}


