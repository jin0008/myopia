import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import {
  clearPartnerToken,
  deleteMyAnswer,
  getPartnerToken,
  getQuestion,
  listQuestions,
  PartnerError,
  saveMyAnswer,
  type AnswerEligibility,
  type QuestionAnswer,
  type QuestionSummary,
} from "../../api/partner";

/**
 * 질문 답변 — 앱 커뮤니티 '시술/수술 질문'에 병원 이름으로 답한다.
 *
 * 보호자는 이 게시판에 댓글을 달 수 없고, 프리미엄 구독 중인 안과만 답한다.
 * 그래서 답은 병원 이름과 '인증 병원' 표시를 달고 앱에 나간다. 의료법상 광고로
 * 읽히는 문구(비용·할인·내원 권유)는 운영자가 숨길 수 있어, 쓰기 전에 알린다.
 */
const REASON: Record<string, string> = {
  not_eye_hospital: "안과 병원만 답변할 수 있습니다.",
  not_approved: "계정 승인 후 답변할 수 있습니다.",
  no_subscription: "프리미엄 구독 중인 병원만 답변할 수 있습니다.",
};

export default function PartnerQuestions() {
  const nav = useNavigate();
  const [eligibility, setEligibility] = useState<AnswerEligibility | null>(null);
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (more = false) => {
    try {
      const r = await listQuestions(more ? cursor ?? undefined : undefined);
      setEligibility(r.eligibility);
      setQuestions((q) => (more ? [...q, ...r.questions] : r.questions));
      setCursor(r.nextCursor);
    } catch (e) {
      if (e instanceof PartnerError && e.code === 401) nav("/partner/login");
      else setError("질문을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    if (!getPartnerToken()) {
      nav("/partner/login");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>질문 답변</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={topBtn} onClick={() => nav("/partner/profile")}>병원 프로필</button>
          <button style={topBtn} onClick={() => nav("/partner/promotions")}>프리미엄</button>
          <button
            style={topBtn}
            onClick={() => {
              clearPartnerToken();
              nav("/partner/login");
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
      <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>
        마이오닥 앱 커뮤니티의 <b>시술/수술 질문</b>입니다. 답변은 병원 이름과 <b>인증 병원</b> 표시를 달고
        앱에 공개되며, 질문하신 분께 알림이 갑니다.
      </p>

      {eligibility && !eligibility.ok && (
        <div style={notice}>
          {REASON[eligibility.reason]}{" "}
          {eligibility.reason === "no_subscription" && (
            <button style={linkBtn} onClick={() => nav("/partner/promotions")}>
              프리미엄 구독하러 가기 →
            </button>
          )}
        </div>
      )}
      {error && <p style={{ color: "#c62828" }}>{error}</p>}

      {questions.map((q) => (
        <div key={q.id} style={card}>
          <button style={qHead} onClick={() => setOpenId(openId === q.id ? null : q.id)}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{q.title}</div>
            <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{q.preview}</div>
            <div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>
              {q.createdAt.slice(0, 10)} · 병원 답변 {q.answerCount}
              {q.answeredByMe && <span style={doneTag}>내가 답변함</span>}
            </div>
          </button>
          {openId === q.id && (
            <QuestionDetail id={q.id} eligibility={eligibility} onChanged={() => void load()} />
          )}
        </div>
      ))}
      {questions.length === 0 && !error && <p style={{ color: "#888" }}>아직 질문이 없습니다.</p>}
      {cursor && (
        <button style={{ ...topBtn, width: "100%", marginTop: 8 }} onClick={() => void load(true)}>
          더 보기
        </button>
      )}
    </div>
  );
}

function QuestionDetail({
  id,
  eligibility,
  onChanged,
}: {
  id: string;
  eligibility: AnswerEligibility | null;
  onChanged: () => void;
}) {
  const [body, setBody] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = async () => {
    const r = await getQuestion(id);
    setBody(r.question.body);
    setImages(r.question.imageUrls);
    setAnswers(r.answers);
    setDraft(r.answers.find((a) => a.mine)?.body ?? "");
  };

  useEffect(() => {
    refresh().catch(() => setMsg("질문을 불러오지 못했습니다."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mine = answers.find((a) => a.mine);
  const canWrite = eligibility?.ok === true;

  const save = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await saveMyAnswer(id, draft.trim());
      await refresh();
      setMsg(mine ? "답변을 고쳤습니다." : "답변을 올렸습니다. 질문하신 분께 알림이 갑니다.");
      onChanged();
    } catch (e) {
      setMsg(e instanceof PartnerError && e.message ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("내 답변을 지울까요?")) return;
    setBusy(true);
    try {
      await deleteMyAnswer(id);
      await refresh();
      setMsg("답변을 지웠습니다.");
      onChanged();
    } catch {
      setMsg("지우지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  if (body == null) return <div style={{ padding: 12, color: "#888" }}>{msg ?? "불러오는 중…"}</div>;

  return (
    <div style={{ padding: "4px 16px 16px" }}>
      <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7 }}>{body}</div>
      {images.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {images.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer">
              <img src={u} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
            </a>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>병원 답변 {answers.length}</h3>
      {answers.map((a) => (
        <div key={a.id} style={{ ...answerBox, ...(a.mine ? { borderColor: "#1A73E8" } : {}) }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {a.hospitalName} {a.mine && <span style={doneTag}>내 답변</span>}
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 4 }}>{a.body}</div>
        </div>
      ))}

      {canWrite ? (
        <div style={{ marginTop: 12 }}>
          <div style={warn}>
            답변은 일반적인 의학 정보로 작성해 주세요. 진료비·할인·이벤트 안내나 내원을 권하는 문구는
            「의료법」상 환자 유인·의료광고에 해당할 수 있어, 운영 정책에 따라 숨겨질 수 있습니다.
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={3000}
            rows={6}
            placeholder="답변을 입력하세요"
            style={textarea}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {mine && (
              <button style={topBtn} disabled={busy} onClick={() => void remove()}>
                지우기
              </button>
            )}
            <button style={primary} disabled={busy || !draft.trim()} onClick={() => void save()}>
              {mine ? "답변 고치기" : "답변 올리기"}
            </button>
          </div>
        </div>
      ) : null}
      {msg && <p style={{ fontSize: 13, color: "#1A73E8" }}>{msg}</p>}
    </div>
  );
}

const topBtn: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
const primary: CSSProperties = { ...topBtn, background: "#1A73E8", color: "#fff", border: "none" };
const linkBtn: CSSProperties = { ...topBtn, border: "none", background: "transparent", color: "#1A73E8", padding: 0 };
const card: CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, marginTop: 12, background: "#fff" };
const qHead: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: 16,
  background: "transparent",
  border: "none",
  cursor: "pointer",
};
const doneTag: CSSProperties = {
  marginLeft: 8,
  padding: "1px 6px",
  borderRadius: 6,
  background: "#e8f0fe",
  color: "#1A73E8",
  fontSize: 11,
  fontWeight: 600,
};
const answerBox: CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginTop: 8 };
const notice: CSSProperties = { background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: 12, fontSize: 14 };
const warn: CSSProperties = { background: "#f5f5f5", borderRadius: 8, padding: 10, fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 1.6 };
const textarea: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 10,
  fontSize: 14,
  lineHeight: 1.6,
  marginBottom: 8,
};
