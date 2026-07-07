import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHospitalList, getMembersByHospital } from "../api/hospital";
import { useCallback, useContext, useMemo, useState } from "react";
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
import {
  createStudy,
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
        <StudyManagement />
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

function StudyManagement() {
  const queryClient = useQueryClient();
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

  const studiesQuery = useQuery({
    queryKey: ["study", "admin"],
    queryFn: getStudies,
  });

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createStudy({
        name: newName.trim(),
        code: newCode.trim() || undefined,
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

  return (
    <Card>
      <SectionTitle>Study Management (연구 관리)</SectionTitle>
      <StudyLayout>
        <div style={{ minWidth: 340 }}>
          <h3 style={{ marginTop: 0 }}>연구 목록</h3>
          {studiesQuery.data?.map((study) => (
            <StudyCardDiv
              key={study.id}
              $selected={selectedStudyId === study.id}
              onClick={() => setSelectedStudyId(study.id)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <b style={{ opacity: study.active ? 1 : 0.5 }}>{study.name}</b>
                <PrimaryNagativeButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleActiveMutation.mutate(study);
                  }}
                >
                  {study.active ? "비활성화" : "활성화"}
                </PrimaryNagativeButton>
              </div>
              <small style={{ color: "#6b7280" }}>
                {study.code ? `code: ${study.code} · ` : ""}
                참여병원 {study._count?.study_hospital ?? 0}곳
                {study.active ? "" : " · (비활성)"}
              </small>
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
              placeholder="코드 (선택)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <PrimaryButton
              onClick={() => newName.trim() && createMutation.mutate()}
            >
              추가
            </PrimaryButton>
          </div>
        </div>

        <div style={{ flex: 1, alignSelf: "stretch" }}>
          {selectedStudyId ? (
            <StudyHospitalAssign key={selectedStudyId} studyId={selectedStudyId} />
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

function StudyHospitalAssign({ studyId }: { studyId: string }) {
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
        {filteredData.map((hospital: any) => (
          <HospitalCard
            key={hospital.id}
            hospital={hospital}
            onSelect={() => onSelect(hospital.id)}
          />
        ))}
      </div>
    </Card>
  );
}
