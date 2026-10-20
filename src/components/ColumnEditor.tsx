import { useRef, useState, type CSSProperties, type ReactNode } from "react";

import { uploadColumnImage } from "../api/column";

/**
 * 칼럼 본문 편집기. 본문은 그대로 마크다운 글자로 저장되고, 버튼은 그 문법을
 * 대신 적어 줄 뿐이다. 앱은 마크다운을 전부가 아니라 몇 가지만 그리므로
 * (myodoc src/features/columns/Markdown.tsx) 버튼도 그것만 둔다.
 *
 * 미리보기는 앱 렌더러의 줄 규칙을 옮겨 왔다. 앱 쪽 규칙을 바꾸면 여기도
 * 같이 바꿔야 미리보기가 거짓말을 하지 않는다.
 */
export default function ColumnEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // 그림을 올리는 사이에도 글은 계속 쓴다. 다 올린 뒤 끼워 넣을 때 그 사이
  // 쓴 글을 옛 본문으로 덮지 않게 늘 최신 본문을 본다.
  const latest = useRef(value);
  latest.current = value;

  /** start~end 를 text 로 바꾸고, 바꾼 뒤 고를 범위를 정한다. */
  function replace(start: number, end: number, text: string, selStart: number, selEnd: number) {
    const v = latest.current;
    onChange(v.slice(0, start) + text + v.slice(end));
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(selStart, selEnd);
    });
  }

  /** 고른 글자 앞뒤를 감싼다. 고른 게 없으면 안내 글자를 넣고 그걸 고른다. */
  function wrap(mark: string, placeholder: string) {
    const ta = ref.current!;
    const { selectionStart: s, selectionEnd: e } = ta;
    const inner = value.slice(s, e) || placeholder;
    replace(s, e, mark + inner + mark, s + mark.length, s + mark.length + inner.length);
  }

  /** 고른 줄마다 앞에 붙인다. 이미 붙어 있으면 뗀다. */
  function prefixLines(prefix: string) {
    const ta = ref.current!;
    const start = value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
    let end = value.indexOf("\n", ta.selectionEnd);
    if (end === -1) end = value.length;
    const lines = value.slice(start, end).split("\n");
    // 제목 단계는 서로 바뀐다(## → ###). 다른 줄 머리는 건드리지 않는다.
    const strip = (l: string) => (prefix.startsWith("#") ? l.replace(/^#{1,3}\s+/, "") : l);
    const allHave = lines.every((l) => l.startsWith(prefix));
    const out = lines
      .map((l) => (allHave ? l.slice(prefix.length) : prefix + strip(l)))
      .join("\n");
    replace(start, end, out, start, start + out.length);
  }

  function link() {
    const ta = ref.current!;
    const { selectionStart: s, selectionEnd: e } = ta;
    const url = prompt("연결할 주소를 넣어 주세요", "https://");
    if (!url || url === "https://") return;
    const text = value.slice(s, e) || "링크 글자";
    const out = `[${text}](${url})`;
    replace(s, e, out, s + 1, s + 1 + text.length);
  }

  /** 그림은 앱에서 한 줄을 통째로 차지해야 그림으로 보인다. */
  async function insertImages(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    const at = ref.current?.selectionEnd ?? value.length;
    setError(null);
    setUploading((n) => n + images.length);
    try {
      const urls: string[] = [];
      for (const f of images) {
        urls.push((await uploadColumnImage(await shrink(f))).url);
        setUploading((n) => n - 1);
      }
      const v = latest.current;
      const before = at > 0 && v[at - 1] !== "\n" ? "\n\n" : "";
      const block = before + urls.map((u) => `![](${u})`).join("\n\n") + "\n\n";
      replace(at, at, block, at + block.length, at + block.length);
    } catch {
      setError("그림을 올리지 못했습니다. 5MB 이하의 그림 파일인지 확인해 주세요.");
    } finally {
      setUploading(0);
    }
  }

  return (
    <div>
      <div style={toolbar}>
        <ToolButton onClick={() => prefixLines("## ")}>제목</ToolButton>
        <ToolButton onClick={() => prefixLines("### ")}>소제목</ToolButton>
        <ToolButton onClick={() => wrap("**", "굵은 글자")}>
          <b>굵게</b>
        </ToolButton>
        <ToolButton onClick={() => prefixLines("- ")}>• 목록</ToolButton>
        <ToolButton onClick={() => prefixLines("> ")}>❝ 인용</ToolButton>
        <ToolButton onClick={link}>🔗 링크</ToolButton>
        <ToolButton onClick={() => fileRef.current?.click()}>🖼 그림 올리기</ToolButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            insertImages(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>
          {uploading > 0 ? `그림 올리는 중… (${uploading})` : "그림은 끌어다 놓거나 붙여넣어도 됩니다"}
        </span>
      </div>
      {error && <p style={{ color: "red", margin: "4px 0" }}>{error}</p>}
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.some((f) => f.type.startsWith("image/"))) {
              e.preventDefault();
              insertImages(files);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const files = Array.from(e.dataTransfer.files);
            if (!files.length) return;
            e.preventDefault();
            insertImages(files);
          }}
          style={textarea}
          placeholder={"글을 쓰세요. 문단 사이는 한 줄 띄웁니다.\n\n## 제목\n- 목록\n> 인용"}
        />
        <div style={preview}>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>앱 미리보기</div>
          <Preview body={value} />
        </div>
      </div>
    </div>
  );
}

/**
 * 휴대폰 사진은 10MB 를 넘기 일쑤인데 앱에서는 폭 400px 남짓으로 보인다.
 * 1.5MB 를 넘는 것만 긴 변 1600px JPEG 로 줄인다 - 작은 PNG·GIF 는 그대로 둬
 * 글자 그림이 뭉개지거나 움직이는 그림이 멈추지 않게 한다.
 */
async function shrink(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/* ---------------- 미리보기 (앱 Markdown.tsx 의 규칙) ---------------- */

type Block =
  | { type: "h"; level: number; text: string }
  | { type: "li"; text: string }
  | { type: "p"; text: string }
  | { type: "img"; url: string }
  | { type: "quote"; text: string }
  | { type: "table"; rows: string[][] };

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  let open: Block | null = null;
  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    const prev = open;
    open = null;
    if (line.trim() === "") {
      flush();
      continue;
    }
    const img = /^!\[[^\]]*\]\((\S+)\)$/.exec(line);
    if (img) {
      flush();
      blocks.push({ type: "img", url: img[1] });
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flush();
      if (prev?.type === "quote") prev.text += " " + quote[1];
      else blocks.push({ type: "quote", text: quote[1] });
      open = blocks[blocks.length - 1];
      continue;
    }
    if (line.startsWith("|")) {
      flush();
      const cells = line.replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
      if (prev?.type !== "table") blocks.push({ type: "table", rows: [cells] });
      else if (!(prev.rows.length === 1 && /^\|[\s|:-]+\|$/.test(line))) prev.rows.push(cells);
      open = blocks[blocks.length - 1];
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      blocks.push({ type: "h", level: h[1].length, text: h[2] });
      continue;
    }
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (li) {
      flush();
      blocks.push({ type: "li", text: li[1] });
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return blocks;
}

/** **굵게**, *기울임*, [글자](주소). 앱이 따로 잡아 주는 맨 주소는 글자로 둔다. */
function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(text.slice(last, m.index));
    if (m[1]) out.push(<a key={m.index} href={m[2]} target="_blank" rel="noreferrer">{m[1]}</a>);
    else if (m[3]) out.push(<b key={m.index}>{m[3]}</b>);
    else out.push(<i key={m.index}>{m[4]}</i>);
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

function Preview({ body }: { body: string }) {
  const blocks = parseBlocks(body);
  if (!blocks.length) return <div style={{ color: "#bbb", fontSize: 14 }}>여기에 앱 화면처럼 보입니다.</div>;
  return (
    <div style={{ fontSize: 15, lineHeight: 1.6, color: "#222" }}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h":
            return (
              <div key={i} style={{ fontWeight: 800, fontSize: [22, 19, 17][b.level - 1], margin: "16px 0 6px" }}>
                <Inline text={b.text} />
              </div>
            );
          case "li":
            return (
              <div key={i} style={{ display: "flex", gap: 6, margin: "2px 0" }}>
                <span>•</span>
                <span><Inline text={b.text} /></span>
              </div>
            );
          case "img":
            return <img key={i} src={b.url} alt="" style={{ width: "100%", borderRadius: 8, margin: "8px 0" }} />;
          case "quote":
            return (
              <div key={i} style={{ borderLeft: "3px solid #7aa7ff", background: "#f3f7ff", padding: "8px 12px", margin: "8px 0", borderRadius: 4 }}>
                <Inline text={b.text} />
              </div>
            );
          case "table":
            return (
              <table key={i} style={{ borderCollapse: "collapse", width: "100%", margin: "8px 0", fontSize: 13 }}>
                <tbody>
                  {b.rows.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((c, ci) => (
                        <td key={ci} style={{ border: "1px solid #ddd", padding: 4, fontWeight: ri === 0 ? 700 : 400 }}>
                          <Inline text={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          default:
            return (
              <p key={i} style={{ margin: "0 0 12px" }}>
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

function ToolButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={toolBtn}>
      {children}
    </button>
  );
}

const toolbar: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 4,
  padding: 6,
  border: "1px solid #ccc",
  borderBottom: "none",
  borderRadius: "6px 6px 0 0",
  background: "#fafafa",
};
const toolBtn: CSSProperties = {
  padding: "4px 10px",
  border: "1px solid #ddd",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
const textarea: CSSProperties = {
  flex: 1,
  minHeight: 480,
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: "0 0 6px 6px",
  fontSize: 14,
  lineHeight: 1.6,
  resize: "vertical",
  boxSizing: "border-box",
};
const preview: CSSProperties = {
  width: 375,
  flexShrink: 0,
  maxHeight: 640,
  overflowY: "auto",
  padding: 16,
  border: "1px solid #eee",
  borderRadius: 12,
  background: "#fff",
  boxSizing: "border-box",
};
