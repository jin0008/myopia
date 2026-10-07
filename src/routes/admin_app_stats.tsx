import { useContext, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";

import { UserContext } from "../App";
import { getAppStats, listGuardians, type AppStats } from "../api/appStats";

/**
 * 마이오닥 앱 보호자 가입 현황.
 *
 * 위는 숫자(현황), 아래는 보호자 목록(문의 응대용 - "로그인이 안 돼요"를
 * 이메일·아이디로 찾는다). 목록은 볼 때마다 서버가 감사 기록을 남긴다.
 */
export default function AdminAppStats() {
  const { user } = useContext(UserContext);
  const admin = user?.is_site_admin === true;
  const q = useQuery({ queryKey: ["admin", "app-stats"], queryFn: getAppStats, enabled: admin });

  if (!admin) return <div style={{ padding: 24 }}>Not authorized</div>;

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={backLink}>
        ← 마이오닥 관리
      </a>
      <h1 style={{ margin: "0 0 4px" }}>가입 현황</h1>
      <p style={muted}>마이오닥 앱 보호자 기준입니다. 의료진·관리자 계정은 빼고 셉니다.</p>

      {q.isLoading ? (
        <p style={muted}>불러오는 중…</p>
      ) : q.isError || q.data == null ? (
        <p style={muted}>불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : (
        <Body s={q.data} />
      )}

      <GuardianList />
    </div>
  );
}

function Body({ s }: { s: AppStats }) {
  const methods: [string, number][] = [
    ["이메일", s.methods.email],
    ["카카오", s.methods.kakao],
    ["네이버", s.methods.naver],
    ["구글", s.methods.google],
    ["애플", s.methods.apple],
  ];
  return (
    <>
      <div style={tiles}>
        <Tile label="전체 보호자" value={s.total} big />
        <Tile label="오늘 가입" value={s.today} />
        <Tile label="최근 7일 가입" value={s.last7} />
        <Tile label="이번 달 가입" value={s.thisMonth} />
      </div>

      <section style={card}>
        <h2 style={h2}>최근 30일 가입</h2>
        <DailyBars daily={s.daily} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <section style={card}>
          <h2 style={h2}>가입 방법</h2>
          <p style={{ ...muted, margin: "0 0 10px" }}>
            한 사람이 둘 이상 쓰면(이메일 가입 후 카카오 연결 등) 양쪽에 셉니다.
          </p>
          <MethodBars rows={methods} />
        </section>
        <section style={card}>
          <h2 style={h2}>자녀 · 이용</h2>
          <Row label="등록된 자녀" value={s.children} />
          <Row label="병원과 연동된 자녀" value={s.linkedChildren} />
          <Row label="최근 7일 앱을 연 보호자" value={s.active7} />
          <Row label="최근 30일 앱을 연 보호자" value={s.active30} />
          <p style={{ ...muted, marginTop: 8 }}>
            앱을 연 보호자는 로그인·자동 로그인 기록으로 어림한 값입니다.
          </p>
        </section>
      </div>
    </>
  );
}

function Tile({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <div style={tile}>
      <div style={muted}>{label}</div>
      <div style={{ fontSize: big ? 30 : 24, fontWeight: 800, color: INK, marginTop: 4 }}>
        {value.toLocaleString()}
        <span style={{ fontSize: 14, fontWeight: 600, color: MUTED, marginLeft: 3 }}>명</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${GRID}` }}>
      <span style={{ color: INK2, fontSize: 14 }}>{label}</span>
      <b style={{ color: INK, fontSize: 14 }}>{value.toLocaleString()}</b>
    </div>
  );
}

/** 30일 막대. 한 계열이라 범례는 없다 - 제목이 이름이다. 막대에 올리면 날짜와 인원. */
function DailyBars({ daily }: { daily: AppStats["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.count));
  const H = 140;
  const md = (day: string) => `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}`;
  const h = hover == null ? null : daily[hover];
  return (
    <div>
      <div style={{ height: 22, fontSize: 13, color: INK2 }}>
        {h ? (
          <>
            <b style={{ color: INK }}>{md(h.day)}</b> 가입 {h.count.toLocaleString()}명
          </>
        ) : (
          <span style={{ color: MUTED }}>막대에 올리면 날짜별 인원이 보입니다 · 가장 많은 날 {max}명</span>
        )}
      </div>
      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 2, height: H, borderBottom: `1px solid ${AXIS}` }}
        onMouseLeave={() => setHover(null)}
      >
        {daily.map((d, i) => (
          // 칸 전체가 올리는 자리다 - 0명인 날도 짚을 수 있게.
          <div
            key={d.day}
            onMouseEnter={() => setHover(i)}
            title={`${md(d.day)} 가입 ${d.count}명`}
            style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", cursor: "default" }}
          >
            <div
              style={{
                width: "100%",
                height: d.count === 0 ? 0 : Math.max(2, (d.count / max) * H),
                background: hover === i ? BAR_HOVER : BAR,
                borderRadius: "4px 4px 0 0",
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: MUTED, marginTop: 4 }}>
        <span>{daily.length > 0 ? md(daily[0].day) : ""}</span>
        <span>{daily.length > 0 ? md(daily[Math.floor(daily.length / 2)].day) : ""}</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

/** 가입 방법. 이름이 줄마다 붙어 있어 색으로 가르지 않는다(한 색). */
function MethodBars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(([, v]) => v));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(([name, v]) => (
        <div key={name} style={{ display: "grid", gridTemplateColumns: "56px 1fr 48px", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13.5, color: INK2 }}>{name}</span>
          <div style={{ height: 12, background: TRACK, borderRadius: 4 }}>
            <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: BAR, borderRadius: 4 }} />
          </div>
          <b style={{ fontSize: 13.5, color: INK, textAlign: "right" }}>{v.toLocaleString()}</b>
        </div>
      ))}
    </div>
  );
}

const METHOD_NAME: Record<string, string> = {
  email: "이메일",
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
  apple: "애플",
};

/** 보호자 목록. 최신 가입순 50명씩, 이메일·아이디로 찾는다. */
function GuardianList() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["admin", "guardians", q, page],
    queryFn: () => listGuardians(q, page),
  });
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (list.data?.pageSize ?? 50)));
  const search = () => {
    setQ(input.trim());
    setPage(1);
  };

  return (
    <section style={card}>
      <h2 style={h2}>보호자 목록</h2>
      <p style={{ ...muted, margin: "0 0 10px" }}>
        개인정보입니다. 조회할 때마다 누가 언제 봤는지 기록이 남습니다.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}
          placeholder="이메일 또는 아이디로 찾기"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button type="button" style={btnStyle} onClick={search}>
          찾기
        </button>
      </div>

      {list.isLoading ? (
        <p style={muted}>불러오는 중…</p>
      ) : list.isError ? (
        <p style={muted}>불러오지 못했습니다.</p>
      ) : (list.data?.guardians.length ?? 0) === 0 ? (
        <p style={muted}>{q ? "찾는 보호자가 없습니다." : "보호자가 없습니다."}</p>
      ) : (
        <>
          <p style={{ ...muted, margin: "0 0 6px" }}>
            {q ? `"${q}" ` : ""}
            {total.toLocaleString()}명
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr>
                  {["가입일", "이메일", "아이디", "가입 방법", "자녀", "병원 연동", "최근 접속"].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.data!.guardians.map((g) => (
                  <tr key={g.id}>
                    <td style={td}>{g.joined.slice(0, 10)}</td>
                    <td style={td}>{g.email ?? "—"}</td>
                    <td style={td}>{g.username ?? "—"}</td>
                    <td style={td}>{g.methods.map((m) => METHOD_NAME[m] ?? m).join(" · ") || "—"}</td>
                    <td style={{ ...td, textAlign: "right" }}>{g.children}</td>
                    <td style={{ ...td, textAlign: "right" }}>{g.linkedChildren}</td>
                    <td style={td}>{g.lastSeen ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
              <button type="button" style={btnStyle} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                이전
              </button>
              <span style={muted}>
                {page} / {pages}
              </span>
              <button type="button" style={btnStyle} disabled={page >= pages} onClick={() => setPage(page + 1)}>
                다음
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// 글자는 잉크 색, 막대만 파랑. 값과 이름표를 막대 색으로 칠하지 않는다.
const INK = "#111827";
const INK2 = "#374151";
const MUTED = "#6b7280";
const GRID = "#f1f3f6";
const AXIS = "#d1d5db";
const TRACK = "#eef1f6";
const BAR = "#1a73e8";
const BAR_HOVER = "#0d47a1";

const backLink: CSSProperties = { display: "inline-block", marginBottom: 12, color: MUTED };
const muted: CSSProperties = { color: MUTED, fontSize: 13, margin: 0 };
const h2: CSSProperties = { fontSize: 15, margin: "0 0 10px", color: INK2 };
const tiles: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  margin: "18px 0 12px",
};
const tile: CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", background: "#fff" };
const card: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  background: "#fff",
  marginBottom: 12,
};
const th: CSSProperties = {
  textAlign: "left",
  fontWeight: 600,
  color: MUTED,
  fontSize: 12.5,
  padding: "6px 8px",
  borderBottom: `1px solid ${AXIS}`,
  whiteSpace: "nowrap",
};
const td: CSSProperties = { padding: "7px 8px", borderBottom: `1px solid ${GRID}`, color: INK, whiteSpace: "nowrap" };
const btnStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#fff",
  borderRadius: 8,
  padding: "7px 14px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};
