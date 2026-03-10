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
import { SearchInput } from "../components/input";
import { UserContext } from "../App";

import downloadIcon from "../assets/download.svg";
import { getMeasurementsByHospital } from "../api/measurement";
import ExcelJS from "exceljs";
import { getEthnicityList, getInstrumentList } from "../api/static";

const Table = styled.table`
  text-align: center;
  height: fit-content;
  & td {
    padding: 8px;
  }
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
          flexGrow: 1,
          height: 0,
          justifyContent: "space-between",
        }}
      >
        <HospitalList onSelect={setSelectedHospitalId} />
        <div>
          <h2>Member List</h2>
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
        </div>
      </div>
    </TopDiv>
  );
}

const HospitalCardDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid black;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    background-color: lightgray;
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
    <div>
      <h2>Hospital List</h2>
      <SearchInput
        placeholder="Search hospital by name or code"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
    </div>
  );
}
