import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHospitalList, getMembersByHospital } from "../api/hospital";
import { useContext, useMemo, useState } from "react";
import styled from "styled-components";
import {
  deleteProfessional,
  updateProfessionalStatus,
} from "../api/healthcare_professional";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import { TopDiv } from "../components/div";
import { SearchInput } from "../components/input";
import { UserContext } from "../App";

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
  return (
    <HospitalCardDiv onClick={onSelect}>
      <p>
        {hospital.name}({hospital.country.code})
      </p>
      <p>Code: {hospital.code}</p>
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
          e.code.includes(search)
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
