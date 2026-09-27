import { useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listAdInquiries,
  updateAdInquiry,
  type AdInquiry,
  type AdInquiryStatus,
} from "../api/adInquiry";

/**
 * 광고 문의 — 파트너 모집 페이지에서 들어온 것을 본다.
 *
 * 들어온 것부터 보인다. 이 화면에 오는 이유가 그것뿐이고, 연락이 늦으면
 * 광고주는 다른 곳에 문의한다.
 *
 * 지우는 버튼은 두지 않는다. 스팸도 '스팸'으로 표시만 하고 남긴다 - 같은
 * 곳에서 반복해 들어오는지 보려면 이력이 있어야 한다.
 */

const KIND_LABEL: Record<AdInquiry["kind"], string> = {
  optical: "안경원",
  eye: "안과",
  company: "제약·관련회사",
};

const STATUS_LABEL: Record<AdInquiryStatus, string> = {
  new: "새 문의",
  contacted: "연락함",
  closed: "종료",
  spam: "스팸",
};

const TABS: { key: AdInquiryStatus | "all"; label: string }[] = [
  { key: "new", label: "새 문의" },
  { key: "contacted", label: "연락함" },
  { key: "all", label: "전체" },
];

export default function AdminAdInquiries() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<AdInquiryStatus | "all">("new");

  const listQuery = useQuery({
    queryKey: ["admin", "ad-inquiries", tab],
    queryFn: () => listAdInquiries(tab === "all" ? undefined : tab),
  });

  const patch = useMutation({
    mutationFn: ({ id, ...rest }: { id: string; status?: AdInquiryStatus; note?: string | null }) =>
      updateAdInquiry(id, rest),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "ad-inquiries"] }),
    onError: () => alert("바꾸지 못했습니다. 잠시 후 다시 시도해 주세요."),
  });

  if (listQuery.isLoading) return <p style={{ padding: 24 }}>불러오는 중…</p>;
  if (listQuery.isError) return <p style={{ padding: 24 }}>불러오지 못했습니다.</p>;

  const rows = listQuery.data?.inquiries ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>광고 문의</h2>
      <p style={hint}>
        파트너 모집 페이지(myodoc/partners.html)에서 들어온 문의입니다. 연락한
        뒤에는 상태를 바꿔 두면 다음에 무엇이 남았는지 한눈에 보입니다.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" style={tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p style={hint}>{tab === "new" ? "새로 들어온 문의가 없습니다." : "문의가 없습니다."}</p>
      ) : (
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>업체</th>
              <th style={th}>담당자</th>
              <th style={th}>문의 내용</th>
              <th style={th}>들어온 때</th>
              <th style={th}>상태</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row
                key={r.id}
                r={r}
                busy={patch.isPending}
                onStatus={(status) => patch.mutate({ id: r.id, status })}
                onNote={(note) => patch.mutate({ id: r.id, note })}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Row({
  r,
  busy,
  onStatus,
  onNote,
}: {
  r: AdInquiry;
  busy: boolean;
  onStatus: (s: AdInquiryStatus) => void;
  onNote: (note: string) => void;
}) {
  const [note, setNote] = useState(r.note ?? "");
  const noteChanged = note.trim() !== (r.note ?? "");

  return (
    <tr>
      <td style={td}>
        <span style={kindTag}>{KIND_LABEL[r.kind]}</span> <b>{r.org}</b>
      </td>
      <td style={td}>
        {r.contactName}
        {/* 연락처를 바로 누를 수 있게 둔다. 이 화면에서 하는 일이 전화와
            메일뿐인데 복사해 옮기면 그때마다 한 단계가 더 든다. */}
        <div style={{ fontSize: 12, marginTop: 2 }}>
          <a href={`tel:${r.phone}`}>{r.phone}</a>
        </div>
        <div style={{ fontSize: 12 }}>
          <a href={`mailto:${r.email}`}>{r.email}</a>
        </div>
      </td>
      <td style={{ ...td, color: "#555", maxWidth: 260 }}>{r.memo || "—"}</td>
      <td style={{ ...td, whiteSpace: "nowrap", color: "#666", fontSize: 13 }}>
        {r.createdAt.slice(0, 16).replace("T", " ")}
      </td>
      <td style={td}>
        <span style={statusTag(r.status)}>{STATUS_LABEL[r.status]}</span>
      </td>
      <td style={{ ...td, minWidth: 230 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["new", "contacted", "closed", "spam"] as const)
            .filter((s) => s !== r.status)
            .map((s) => (
              <button key={s} type="button" style={smallBtn} disabled={busy} onClick={() => onStatus(s)}>
                {STATUS_LABEL[s]}
              </button>
            ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input
            style={noteInput}
            placeholder="메모 (누가 언제 연락했는지)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            style={smallBtn}
            disabled={busy || !noteChanged}
            onClick={() => onNote(note.trim())}
          >
            저장
          </button>
        </div>
      </td>
    </tr>
  );
}

const hint: CSSProperties = { color: "#666", fontSize: 13, margin: "0 0 4px", lineHeight: 1.6 };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const th: CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "2px solid #e3e6ea",
  background: "#f7f8fa",
  whiteSpace: "nowrap",
};
const td: CSSProperties = { padding: "10px", borderBottom: "1px solid #eceff3", verticalAlign: "top" };
const kindTag: CSSProperties = {
  display: "inline-block",
  padding: "1px 7px",
  borderRadius: 999,
  background: "#eef2ff",
  color: "#3949ab",
  fontSize: 12,
};
const smallBtn: CSSProperties = {
  padding: "5px 10px",
  fontSize: 12.5,
  border: "1px solid #ccd2da",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};
const noteInput: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "5px 8px",
  fontSize: 12.5,
  border: "1px solid #ccd2da",
  borderRadius: 6,
};

function tabBtn(active: boolean): CSSProperties {
  return {
    padding: "6px 14px",
    fontSize: 13.5,
    borderRadius: 999,
    border: "1px solid " + (active ? "#3949ab" : "#ccd2da"),
    background: active ? "#3949ab" : "#fff",
    color: active ? "#fff" : "#444",
    cursor: "pointer",
  };
}

function statusTag(s: AdInquiryStatus): CSSProperties {
  const tone: Record<AdInquiryStatus, [string, string]> = {
    new: ["#e8f0fe", "#1557b0"],
    contacted: ["#e6f4ea", "#137333"],
    closed: ["#f1f3f4", "#5f6368"],
    spam: ["#fce8e6", "#c5221f"],
  };
  const [bg, fg] = tone[s];
  return {
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 999,
    background: bg,
    color: fg,
    fontSize: 12.5,
    whiteSpace: "nowrap",
  };
}
