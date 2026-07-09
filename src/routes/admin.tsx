import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHospitalList, getMembersByHospital } from "../api/hospital";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  deleteProfessional,
  updateProfessionalStatus,
} from "../api/healthcare_professional";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import { TopDiv } from "../components/div";
import { SearchInput, TextInput } from "../components/input";
import { UserContext } from "../App";

import downloadIcon from "../assets/download.svg";
import { getMeasurementsByHospital } from "../api/measurement";
import ExcelJS from "exceljs";
import { getEthnicityList, getInstrumentList } from "../api/static";
import AdminAuditLog from "./admin_audit_log";
import StudyAuditLog from "./study_audit_log";
import {
  AlertSetting,
  AlertSettingInput,
  getAlertSetting,
  updateAlertSetting,
} from "../api/alert_setting";
import {
  createStudy,
  deleteStudy,
  getStudies,
  getStudyHospitals,
  setStudyHospitals,
  updateStudy,
  type Study,
} from "../api/study";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  & th,
  & td {
    padding: 10px 12px;
    text-align: center;
    white-space: nowrap;
  }
  & thead th {
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
  }
  & tbody tr:nth-child(even) {
    background: #fafafa;
  }
  & tbody tr:hover {
    background: #f0f9ff;
  }
  & tbody td {
    border-bottom: 1px solid #f0f0f0;
    color: #374151;
  }
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 20px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 16px 0;
`;

export default function Admin() {
  const { user } = useContext(UserContext);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");

  const memberListQuery = useQuery({
    queryKey: ["hospital", selectedHospitalId, "member"],
    queryFn: () => getMembersByHospital(selectedHospitalId),
    enabled: !!selectedHospitalId,
  });
  const queryClient = useQueryClient();
  const editMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: {
        approved?: boolean;
        is_admin?: boolean;
      };
    }) => {
      return updateProfessionalStatus(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hospital", selectedHospitalId, "member"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteProfessional(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hospital", selectedHospitalId, "member"],
      });
    },
  });

  if (!user?.is_site_admin) {
    return <div>Not authorized</div>;
  }

  return (
    <TopDiv>
      <h1>Admin Page</h1>
      <div
        style={{
          display: "flex",
          width: "80%",
          gap: "24px",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <HospitalList onSelect={setSelectedHospitalId} />
        <Card style={{ flex: 1 }}>
          <SectionTitle>Member List</SectionTitle>
          <Table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>name</th>
                <th>approve</th>
                <th>reject/kick</th>
                <th>admin</th>
              </tr>
            </thead>
            <tbody>
              {memberListQuery.data?.map((e: any) => (
                <tr key={e.user_id}>
                  <td>{e.user_id}</td>
                  <td>{e.name}</td>
                  <td>
                    {e.approved ? (
                      "Approved"
                    ) : (
                      <PrimaryButton
                        onClick={() =>
                          editMutation.mutate({
                            userId: e.user_id,
                            data: { approved: true },
                          })
                        }
                      >
                        Approve
                      </PrimaryButton>
                    )}
                  </td>
                  <td>
                    {
                      <PrimaryButton
                        onClick={() => deleteMutation.mutate(e.user_id)}
                      >
                        {e.approved ? "Kick" : "Reject"}
                      </PrimaryButton>
                    }
                  </td>
                  <td>
                    {e.is_admin ? (
                      <PrimaryNagativeButton
                        onClick={() =>
                          editMutation.mutate({
                            userId: e.user_id,
                            data: { is_admin: false },
                          })
                        }
                      >
                        Set as not admin
                      </PrimaryNagativeButton>
                    ) : e.approved ? (
                      <PrimaryButton
                        onClick={() =>
                          editMutation.mutate({
                            userId: e.user_id,
                            data: { is_admin: true },
                          })
                        }
                      >
                        Set as admin
                      </PrimaryButton>
                    ) : (
                      <></>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
      <div style={{ width: "80%", marginTop: "32px" }}>
        <AlertSettingManagement />
      </div>
      <div style={{ width: "80%", marginTop: "32px" }}>
        <StudyManagement />
      </div>
      <div style={{ width: "80%", marginTop: "32px" }}>
        <StudyAuditLog />
      </div>
      <div style={{ width: "80%", marginTop: "32px" }}>
        <AdminAuditLog />
      </div>
    </TopDiv>
  );
}

const HospitalCardDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: background 0.15s, border-color 0.15s;
  &:hover {
    background-color: #f0f9ff;
    border-color: #bae6fd;
  }
`;

function HospitalCard({
  hospital,
  onSelect,
}: {
  hospital: any;
  onSelect: () => void;
}) {
  const queryClient = useQueryClient();

  const handleDownload = useCallback(async () => {
    try {
      if (!confirm("Download measurements for this hospital?")) {
        return;
      }
      const data = await getMeasurementsByHospital(hospital.id);
      const instrumentList = await queryClient.fetchQuery({
        queryKey: ["instrument"],
        queryFn: () => getInstrumentList(),
        staleTime: Infinity,
        gcTime: Infinity,
      });
      const ethnicityList = await queryClient.fetchQuery({
        queryKey: ["ethnicity"],
        queryFn: () => getEthnicityList(),
        staleTime: Infinity,
        gcTime: Infinity,
      });
      const instrumentIdToName: Map<string, string> = new Map(
        instrumentList.map((instrument: any) => [
          instrument.id,
          instrument.name,
        ]),
      );
      const ethnicityIdToName: Map<string, string> = new Map(
        ethnicityList.map((ethnicity: any) => [ethnicity.id, ethnicity.name]),
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Measurements");
      worksheet.columns = [
        { header: "hospital", key: "hospital" },
        { header: "registration_number", key: "registration_number" },
        { header: "date_of_birth", key: "date_of_birth" },
        { header: "sex", key: "sex" },
        { header: "ethnicity", key: "ethnicity" },
        { header: "date", key: "date" },
        { header: "instrument", key: "instrument" },
        { header: "OD", key: "od" },
        { header: "OS", key: "os" },
      ];
      const hospitalName = hospital.name + " (" + hospital.code + ")";
      data.forEach((patient: any) => {
        const registrationNumber = patient.registration_number;
        const dateOfBirth = patient.date_of_birth.split("T")[0];
        const sex = patient.sex;
        const ethnicity =
          ethnicityIdToName.get(patient.ethnicity_id) || "Unknown";
        patient.measurement.forEach((measurement: any) => {
          const date = measurement.date.split("T")[0];
          const instrument =
            instrumentIdToName.get(measurement.instrument_id) || "Unknown";
          const od = measurement.od;
          const os = measurement.os;
          worksheet.addRow({
            hospital: hospitalName,
            registration_number: registrationNumber,
            date_of_birth: dateOfBirth,
            sex: sex,
            ethnicity: ethnicity,
            date: date,
            instrument: instrument,
            od: od,
            os: os,
          });
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${hospital.name}(${hospital.code}).xlsx`;
      a.click();
    } catch (error) {
      alert("Error downloading measurements");
      console.error(error);
    }
  }, [hospital, queryClient]);

  return (
    <HospitalCardDiv onClick={onSelect}>
      <div>
        <p>
          {hospital.name}({hospital.country.code})
        </p>
        <p>Code: {hospital.code}</p>
      </div>
      <img
        src={downloadIcon}
        style={{ width: "24px", height: "24px" }}
        alt="download"
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
      />
    </HospitalCardDiv>
  );
}

const StudyLayout = styled.div`
  display: flex;
  flex-direction: row;
  gap: 24px;
  align-items: flex-start;
`;

const StudyCardDiv = styled.div<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid ${(p) => (p.$selected ? "#0284c7" : "#e5e7eb")};
  background-color: ${(p) => (p.$selected ? "#f0f9ff" : "#fff")};
  cursor: pointer;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: background 0.15s, border-color 0.15s;
  &:hover {
    border-color: #bae6fd;
  }
`;

const HospitalCheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
  color: #374151;
`;

const ALERT_FIELDS: {
  key: keyof AlertSettingInput;
  label: string;
  step: string;
}[] = [
  { key: "axial_min", label: "안축장 정상범위 하한 (mm)", step: "0.1" },
  { key: "axial_max", label: "안축장 정상범위 상한 (mm)", step: "0.1" },
  { key: "axial_decrease_mm", label: "안축장 직전대비 감소 경고 (mm)", step: "0.1" },
  {
    key: "axial_increase_mm_per_year",
    label: "안축장 증가속도 경고 (mm/year)",
    step: "0.1",
  },
  { key: "se_min", label: "SE 고도근시 임계 (D, 음수)", step: "0.25" },
  {
    key: "se_progression_d_per_year",
    label: "SE 진행속도 경고 (D/year)",
    step: "0.25",
  },
];

function AlertSettingManagement() {
  const queryClient = useQueryClient();
  const settingQuery = useQuery({
    queryKey: ["alert_setting"],
    queryFn: getAlertSetting,
  });

  const [form, setForm] = useState<AlertSettingInput | null>(null);

  // Seed the editable form once the current setting loads.
  useEffect(() => {
    if (settingQuery.data) {
      const { id: _id, ...rest } = settingQuery.data as AlertSetting;
      setForm(rest);
    }
  }, [settingQuery.data]);

  const mutation = useMutation({
    mutationFn: (data: AlertSettingInput) => updateAlertSetting(data),
    onSuccess: () => {
      alert("알림 기준이 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["alert_setting"] });
    },
    onError: (e: any) => alert(e?.message ?? "저장 실패"),
  });

  return (
    <Card>
      <SectionTitle>Alert Threshold (알림 기준 설정)</SectionTitle>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        측정값 저장 시 이메일 알림과 차트 입력 경고 팝업이 아래 기준을 따릅니다.
        (전역 공통 설정)
      </p>
      {form == null ? (
        <p>불러오는 중…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
            maxWidth: 720,
          }}
        >
          {ALERT_FIELDS.map(({ key, label, step }) => (
            <label
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              {label}
              <TextInput
                type="number"
                step={step}
                value={String(form[key])}
                onChange={(e) =>
                  setForm({ ...form, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <PrimaryButton
              onClick={() => {
                if (form.axial_min >= form.axial_max) {
                  alert("안축장 정상범위 하한은 상한보다 작아야 합니다.");
                  return;
                }
                mutation.mutate(form);
              }}
            >
              저장
            </PrimaryButton>
            <PrimaryNagativeButton
              onClick={() => {
                if (settingQuery.data) {
                  const { id: _id, ...rest } =
                    settingQuery.data as AlertSetting;
                  setForm(rest);
                }
              }}
            >
              되돌리기
            </PrimaryNagativeButton>
          </div>
        </div>
      )}
    </Card>
  );
}

function StudyManagement() {
  const queryClient = useQueryClient();
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

  const studiesQuery = useQuery({
    queryKey: ["study", "admin"],
    queryFn: getStudies,
  });

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  // Selecting a study opens it for editing (name/code) on the left card while
  // the right panel assigns its hospitals — there is no separate 수정 button.
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const selectStudy = (study: Study) => {
    setSelectedStudyId(study.id);
    setEditName(study.name);
    setEditCode(study.code ?? "");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createStudy({
        name: newName.trim(),
        code: newCode.trim(),
      }),
    onSuccess: () => {
      setNewName("");
      setNewCode("");
      queryClient.invalidateQueries({ queryKey: ["study", "admin"] });
    },
    onError: (e: any) => alert(e?.message ?? "연구 생성 실패"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (study: Study) =>
      updateStudy(study.id, { active: !study.active }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["study", "admin"] }),
    onError: () => alert("상태 변경 실패"),
  });

  const editMutation = useMutation({
    mutationFn: (vars: { id: string; name: string; code: string }) =>
      updateStudy(vars.id, { name: vars.name, code: vars.code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study", "admin"] });
      alert("저장되었습니다.");
      setSelectedStudyId(null); // 저장 후 요약 목록으로 복귀
    },
    onError: (e: any) => alert(e?.message ?? "수정 실패"),
  });

  const deleteMutation = useMutation({
    mutationFn: (studyId: string) => deleteStudy(studyId),
    onSuccess: (_data, studyId) => {
      if (selectedStudyId === studyId) setSelectedStudyId(null);
      queryClient.invalidateQueries({ queryKey: ["study", "admin"] });
    },
    onError: () => alert("삭제 실패"),
  });

  return (
    <Card>
      <SectionTitle>Study Management (연구 관리)</SectionTitle>
      <StudyLayout>
        <div style={{ flex: 3, minWidth: 0 }}>
          <h3 style={{ marginTop: 0 }}>연구 목록</h3>
          {studiesQuery.data?.map((study) => (
            <StudyCardDiv
              key={study.id}
              $selected={selectedStudyId === study.id}
              onClick={() => {
                if (selectedStudyId !== study.id) selectStudy(study);
              }}
            >
              {selectedStudyId === study.id ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <TextInput
                    placeholder="연구명"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <TextInput
                    placeholder="코드 (필수, 예: LPTAT) — 연구번호 접두어"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <PrimaryButton
                      onClick={() => {
                        if (!editName.trim() || !editCode.trim()) {
                          alert("연구명과 코드를 모두 입력해주세요.");
                          return;
                        }
                        editMutation.mutate({
                          id: study.id,
                          name: editName.trim(),
                          code: editCode.trim(),
                        });
                      }}
                    >
                      저장
                    </PrimaryButton>
                    <PrimaryNagativeButton
                      onClick={() => toggleActiveMutation.mutate(study)}
                    >
                      {study.active ? "비활성화" : "활성화"}
                    </PrimaryNagativeButton>
                    <PrimaryNagativeButton
                      style={{ background: "#dc2626" }}
                      onClick={() => {
                        if (
                          confirm(
                            `"${study.name}" 연구를 삭제할까요?\n등록된 환자·방문 데이터가 모두 함께 삭제되며 되돌릴 수 없습니다.`,
                          )
                        )
                          deleteMutation.mutate(study.id);
                      }}
                    >
                      삭제
                    </PrimaryNagativeButton>
                  </div>
                  <small style={{ color: "#9ca3af" }}>
                    참여병원 {study._count?.study_hospital ?? 0}곳
                    {study.active ? "" : " · (비활성)"} · 우측에서 참여병원을
                    지정하세요. ※ 코드를 바꿔도 이미 부여된 기존 연구번호는
                    변경되지 않고, 이후 등록되는 환자부터 새 코드가 적용됩니다.
                  </small>
                </div>
              ) : (
                <>
                  <b style={{ opacity: study.active ? 1 : 0.5 }}>
                    {study.name}
                  </b>
                  <small style={{ color: "#6b7280", display: "block" }}>
                    {study.code ? `code: ${study.code} · ` : "code: (없음) · "}
                    참여병원 {study._count?.study_hospital ?? 0}곳
                    {study.active ? "" : " · (비활성)"}
                  </small>
                </>
              )}
            </StudyCardDiv>
          ))}

          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <h4 style={{ margin: 0 }}>새 연구 추가</h4>
            <TextInput
              placeholder="연구명 (예: LPTAT-OS: 마이오클리어 0.05% PMS)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <TextInput
              placeholder="코드 (필수, 예: LPTAT) — 연구번호 접두어로 사용됩니다"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <PrimaryButton
              onClick={() => {
                if (!newName.trim() || !newCode.trim()) {
                  alert("연구명과 코드를 모두 입력해주세요. 코드는 연구번호 접두어로 사용됩니다.");
                  return;
                }
                createMutation.mutate();
              }}
            >
              추가
            </PrimaryButton>
          </div>
        </div>

        <div style={{ flex: 7, minWidth: 0, alignSelf: "stretch" }}>
          {selectedStudyId ? (
            <StudyHospitalAssign
              key={selectedStudyId}
              studyId={selectedStudyId}
              onSaved={() => setSelectedStudyId(null)}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 180,
                height: "100%",
                color: "#6b7280",
              }}
            >
              연구를 선택하면 참여 병원을 지정할 수 있습니다.
            </div>
          )}
        </div>
      </StudyLayout>
    </Card>
  );
}

function StudyHospitalAssign({
  studyId,
  onSaved,
}: {
  studyId: string;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const hospitalsQuery = useQuery({
    queryKey: ["hospital"],
    queryFn: getHospitalList,
  });

  const assignedQuery = useQuery({
    queryKey: ["study", studyId, "hospital"],
    queryFn: () => getStudyHospitals(studyId),
  });

  // Local editable set, seeded from the server once loaded.
  const [checked, setChecked] = useState<Set<string> | null>(null);
  const effectiveChecked = useMemo(
    () => checked ?? new Set(assignedQuery.data ?? []),
    [checked, assignedQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: () => setStudyHospitals(studyId, Array.from(effectiveChecked)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study", studyId, "hospital"],
      });
      queryClient.invalidateQueries({ queryKey: ["study", "admin"] });
      alert("저장되었습니다.");
      onSaved(); // 저장 후 요약 목록으로 복귀
    },
    onError: () => alert("저장 실패"),
  });

  const toggle = (hospitalId: string) => {
    const next = new Set(effectiveChecked);
    next.has(hospitalId) ? next.delete(hospitalId) : next.add(hospitalId);
    setChecked(next);
  };

  const filtered = useMemo(() => {
    const list = (hospitalsQuery.data as any[]) ?? [];
    if (!search) return list;
    return list.filter(
      (h) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.code.includes(search),
    );
  }, [hospitalsQuery.data, search]);

  if (assignedQuery.isLoading || hospitalsQuery.isLoading)
    return <div>Loading...</div>;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>참여 병원 지정</h3>
      <SearchInput
        placeholder="병원 이름/코드 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <div
        style={{
          maxHeight: 320,
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "8px 14px",
          margin: "8px 0",
        }}
      >
        {filtered.map((h: any) => (
          <HospitalCheckRow key={h.id}>
            <input
              type="checkbox"
              checked={effectiveChecked.has(h.id)}
              onChange={() => toggle(h.id)}
            />
            <span>
              {h.name} ({h.code})
            </span>
          </HospitalCheckRow>
        ))}
      </div>
      <PrimaryButton onClick={() => saveMutation.mutate()}>
        저장 ({effectiveChecked.size}곳 선택됨)
      </PrimaryButton>
    </div>
  );
}

function HospitalList({ onSelect }: { onSelect: (hospitalId: any) => void }) {
  const query = useQuery({
    queryKey: ["hospital"],
    queryFn: getHospitalList,
  });

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_COUNT = 5;

  const filteredData = useMemo(() => {
    if (query.data) {
      return query.data.filter(
        (e: any) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.code.includes(search),
      );
    }
    return [];
  }, [query.data, search]);
  if (query.isLoading) {
    return <div>Loading...</div>;
  }
  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // Collapse the (long) list to a few rows; searching always shows all matches.
  const isSearching = search.trim().length > 0;
  const visibleData =
    expanded || isSearching ? filteredData : filteredData.slice(0, COLLAPSED_COUNT);
  const hiddenCount = filteredData.length - visibleData.length;
  const showToggle = !isSearching && filteredData.length > COLLAPSED_COUNT;

  return (
    <Card style={{ minWidth: "320px" }}>
      <SectionTitle>Hospital List</SectionTitle>
      <SearchInput
        placeholder="Search hospital by name or code"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "12px", width: "100%" }}
      />
      <div>
        {visibleData.map((hospital: any) => (
          <HospitalCard
            key={hospital.id}
            hospital={hospital}
            onSelect={() => onSelect(hospital.id)}
          />
        ))}
      </div>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px",
            background: "transparent",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            color: "#374151",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {expanded ? "접기 ▲" : `더보기 (${hiddenCount}개 더) ▼`}
        </button>
      )}
    </Card>
  );
}
