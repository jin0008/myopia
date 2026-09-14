import { HttpError } from "../lib/fetch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopDiv } from "../components/div";
import {
  approvePatientDeletionRequest,
  getPatientDeleteRequests,
  rejectPatientDeletionRequest,
} from "../api/patient";
import { PrimaryButton } from "../components/button";
import styled from "styled-components";

const ContentWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
`;

const Table = styled.table`
  text-align: center;
  & th {
    padding: 8px;
  }
`;

export default function PatientDeleteRequest() {
  const queryClient = useQueryClient();

  const { data: pendingDeletionRequests } = useQuery({
    queryKey: ["patient", "deleteRequest"],
    queryFn: getPatientDeleteRequests,
  });

  const approveMutation = useMutation({
    mutationFn: approvePatientDeletionRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", "deleteRequest"],
      });
    },
    // 연동이 걸려 있으면 삭제가 막힌다(409). 아무 말도 없으면 승인 버튼이
    // 먹통인 것처럼 보인다.
    onError: (e) =>
      alert(
        e instanceof HttpError && e.code === 409
          ? "이 환자는 보호자 앱과 연동되어 있어 삭제할 수 없습니다.\n환자의 '연동하기'에서 연동을 해제한 뒤 다시 시도해 주세요."
          : "삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectPatientDeletionRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", "deleteRequest"],
      });
    },
  });

  return (
    <>
      <TopDiv>
        <h1>Patient Delete Request</h1>
        <ContentWrapper>
          {pendingDeletionRequests?.length === 0 ? (
            <div>No pending deletion requests</div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Patient Registration Number</th>
                  <th>Requested By</th>
                  <th>Request Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeletionRequests?.map((request: any) => (
                  <tr key={request.patient_id}>
                    <td>{request.patient.registration_number}</td>
                    <td>{request.healthcare_professional.name}</td>
                    <td>{request.request_date.split("T")[0]}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <PrimaryButton
                          onClick={() =>
                            approveMutation.mutate(request.patient_id)
                          }
                        >
                          Approve
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() =>
                            rejectMutation.mutate(request.patient_id)
                          }
                        >
                          Reject
                        </PrimaryButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </ContentWrapper>
      </TopDiv>
    </>
  );
}
