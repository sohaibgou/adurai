#!/usr/bin/env python3
"""Convert a Claude Code .jsonl session transcript into readable Markdown."""
import sys, json, datetime

SRC = sys.argv[1]
OUT = sys.argv[2]
MAX_TOOL_OUTPUT = 1500  # chars before truncation


def text_from_content(content):
    """Return (text_parts, tool_uses, tool_results) from a message content."""
    texts, tools, results = [], [], []
    if isinstance(content, str):
        if content.strip():
            texts.append(content)
        return texts, tools, results
    if not isinstance(content, list):
        return texts, tools, results
    for block in content:
        if not isinstance(block, dict):
            continue
        t = block.get("type")
        if t == "text":
            if block.get("text", "").strip():
                texts.append(block["text"])
        elif t == "thinking":
            pass  # skip internal reasoning
        elif t == "tool_use":
            name = block.get("name", "tool")
            inp = block.get("input", {})
            inp_str = json.dumps(inp, ensure_ascii=False)
            if len(inp_str) > 400:
                inp_str = inp_str[:400] + " …(truncated)"
            tools.append((name, inp_str))
        elif t == "tool_result":
            c = block.get("content", "")
            if isinstance(c, list):
                parts = []
                for sub in c:
                    if isinstance(sub, dict):
                        if sub.get("type") == "text":
                            parts.append(sub.get("text", ""))
                        elif sub.get("type") == "image":
                            parts.append("[image omitted]")
                c = "\n".join(parts)
            if not isinstance(c, str):
                c = str(c)
            if len(c) > MAX_TOOL_OUTPUT:
                c = c[:MAX_TOOL_OUTPUT] + f"\n…(truncated, {len(c)} chars total)"
            results.append(c)
    return texts, tools, results


def fmt_ts(ts):
    if not ts:
        return ""
    try:
        d = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return d.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return ts


lines_out = ["# Claude Code Session Transcript", ""]
n_user = n_asst = 0

with open(SRC, "r", encoding="utf-8", errors="replace") as f:
    for raw in f:
        raw = raw.strip()
        if not raw:
            continue
        try:
            obj = json.loads(raw)
        except Exception:
            continue
        if obj.get("type") not in ("user", "assistant"):
            continue
        msg = obj.get("message", {})
        role = msg.get("role")
        content = msg.get("content")
        texts, tools, results = text_from_content(content)
        ts = fmt_ts(obj.get("timestamp"))

        if role == "user":
            # Skip pure tool_result turns (no real user text)
            if not texts and results:
                for r in results:
                    if r.strip():
                        lines_out.append(f"> _tool result:_ ```\n{r}\n```\n")
                continue
            if not texts:
                continue
            n_user += 1
            lines_out.append(f"\n---\n\n## 🧑 User  · {ts}\n")
            for tx in texts:
                lines_out.append(tx + "\n")
        elif role == "assistant":
            chunk = []
            for tx in texts:
                chunk.append(tx + "\n")
            for name, inp in tools:
                chunk.append(f"\n**🔧 {name}** `{inp}`\n")
            if not chunk:
                continue
            n_asst += 1
            lines_out.append(f"\n### 🤖 Assistant  · {ts}\n")
            lines_out.extend(chunk)

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines_out))

print(f"Wrote {OUT}")
print(f"User messages: {n_user} | Assistant turns: {n_asst}")
