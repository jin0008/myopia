import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../App";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import { CenteredDiv, TopDiv } from "../../components/div";
import { TextInput } from "../../components/input";
import styled from "styled-components";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCountryList,
  getEthnicityList,
  getInstrumentList,
} from "../../api/static";
import { getHospitalList } from "../../api/hospital";
import { registerProfessional } from "../../api/healthcare_professional";
import { deletePatient, getPatients, registerPatient } from "../../api/patient";
import { useNavigate } from "react-router";
import ConfirmDialog from "../../components/dialog";
import { PatientCard } from "../../components/patient_card";
import NotLoggedIn from "../../components/not_logged_in";

const CenteredDivWithGap = styled(CenteredDiv)`
  gap: 32px;
`;

const PatientSearchDiv = styled.div`
  width: 100%;
  margin-top: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export default function ProfessionalProfile() {
  const { user } = useContext(UserContext);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  if (user == null) return <NotLoggedIn />;
  else if (user.healthcare_professional == null) {
    return (
      <>
        <CenteredDivWithGap>
          You are not registered as a healthcare professional.
          <PrimaryButton onClick={() => setRegisterDialogOpen(true)}>
            Register
          </PrimaryButton>
        </CenteredDivWithGap>
        <ProfessionalRegisterDialog
          open={registerDialogOpen}
          onClose={() => setRegisterDialogOpen(false)}
        />
      </>
    );
  } else if (!user.healthcare_professional.approved) {
    return (
      <CenteredDiv>
        Your healthcare professional registration is pending. Please wait until
        it is approved.
        <br />
        Your user id is <strong>{user.id}</strong>
      </CenteredDiv>
    );
  } else {
    //approved healthcare professional
    return <PatientManage />;
  }
}

const SearchInput = styled.input`
  width: 320px;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid #ccc;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

function PatientSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SearchInput
      placeholder="search by registration #"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    ></SearchInput>
  );
}

function PatientManage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useContext(UserContext);

  const hospital = user.healthcare_professional.hospital;
  return (
    <>
      <TopDiv
        style={{
          margin: "0 128px",
        }}
      >
        <PatientSearchDiv>
          <PatientSearch value={search} onChange={setSearch} />
          <h2>{hospital.name}</h2>
          <div></div>
          <PrimaryButton onClick={() => setOpen(true)}>
            new patient
          </PrimaryButton>
        </PatientSearchDiv>
        <PatientList search={search} />
      </TopDiv>
      <PatientRegisterDialog open={open} setOpen={setOpen} />
    </>
  );
}

function ProfessionalRegisterDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const countryQuery = useQuery({
    queryKey: ["country"],
    queryFn: getCountryList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const hospitalQuery = useQuery({
    queryKey: ["hospital"],
    queryFn: getHospitalList,
  });

  const ethnicityQuery = useQuery({
    queryKey: ["ethnicity"],
    queryFn: getEthnicityList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const instrumentQuery = useQuery({
    queryKey: ["instrument"],
    queryFn: getInstrumentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: registerProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onClose();
      if (createNewHospital)
        alert(
          "You are now admin of the hospital.\nYou can visit My profile to approve others to join"
        );
      else alert("Please wait for approval by hospital admin to join");
    },
    onError: () => alert("An error occured"),
  });

  const name = useRef("");
  const [countryId, setCountryId] = useState("");

  const [hospitalCode, setHospitalCode] = useState("");
  const hospitalName = useRef("");
  const [hospitalCountryId, setHospitalCountryId] = useState("");

  const defaultEthnicityId = useRef("");
  const defaultInstrumentId = useRef("");

  useEffect(() => {
    if (countryQuery.isSuccess) {
      const first = countryQuery.data?.[0];
      setCountryId(first?.id);
      setHospitalCountryId(first?.id);
    }
  }, [countryQuery.isSuccess]);

  const [createNewHospital, setCreateNewHospital] = useState(false);

  const hospitalId = hospitalQuery.data?.find(
    (e: any) => e.code === hospitalCode
  )?.id;

  const handleSubmit = () => {
    if (!name.current) {
      alert("Missing field: name");
      return;
    }

    if (createNewHospital) {
      if (!/^[a-zA-Z0-9]{1,10}$/.test(hospitalCode)) {
        alert("Invalid hospital code");
        return;
      }
      if (!hospitalName.current) {
        alert("Missing field: hospital name");
        return;
      }
      if (hospitalId != null) {
        alert("Hospital code already exists");
        return;
      }
    }

    if (!createNewHospital) {
      if (hospitalId == null) {
        alert("Hospital not found");
        return;
      }
    }
    const hospitalData = createNewHospital
      ? {
          name: hospitalName.current,
          country_id: hospitalCountryId,
          code: hospitalCode,
        }
      : {
          id: hospitalQuery.data.find((e: any) => e.code === hospitalCode)?.id,
        };
    const data = {
      name: name.current,
      country_id: countryId,
      hospital: hospitalData,
      default_ethnicity_id: defaultEthnicityId.current || null,
      default_instrument_id: defaultInstrumentId.current || null,
    };
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Register as healthcare professional</DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label>
            Name:
            <TextInput
              placeholder="Name"
              onChange={(e) => (name.current = e.target.value)}
            ></TextInput>
          </label>
          <label>
            Country:
            <TextInput
              as="select"
              onChange={(e) => setCountryId(e.target.value)}
            >
              {countryQuery.data?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}({e.code})
                </option>
              ))}
            </TextInput>
          </label>

          <label>
            Join existing hospital
            <input
              type="radio"
              checked={!createNewHospital}
              onChange={(e) => setCreateNewHospital(!e.target.checked)}
            />
          </label>
          <label>
            Register new hospital
            <input
              type="radio"
              checked={createNewHospital}
              onChange={(e) => setCreateNewHospital(e.target.checked)}
            />
          </label>
          <div style={{ height: "16px" }}></div>

          {createNewHospital ? (
            <div>
              <label>
                Hospital name:
                <TextInput
                  placeholder="Hospital name"
                  onChange={(e) => (hospitalName.current = e.target.value)}
                ></TextInput>
              </label>
              <label>
                Hospital country:
                <TextInput
                  as="select"
                  onChange={(e) => setHospitalCountryId(e.target.value)}
                >
                  {countryQuery.data?.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.name}({e.code})
                    </option>
                  ))}
                </TextInput>
              </label>
            </div>
          ) : null}
          <label>
            Hospital code:
            <TextInput
              value={hospitalCode}
              onChange={(e) => setHospitalCode(e.target.value)}
              pattern="^[a-zA-Z0-9]{1,10}$"
              style={{
                borderColor:
                  (createNewHospital && hospitalId != null) ||
                  (!createNewHospital && hospitalId == null)
                    ? "red"
                    : undefined,
              }}
            ></TextInput>
          </label>
          <label>
            Default ethnicity(Optional)
            <TextInput
              as="select"
              onChange={(e) => (defaultEthnicityId.current = e.target.value)}
            >
              <option key={""} value={""}>
                (None)
              </option>
              {ethnicityQuery.data?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </TextInput>
          </label>
          <label>
            Default instrument(Optional)
            <TextInput
              as="select"
              onChange={(e) => (defaultInstrumentId.current = e.target.value)}
            >
              <option key={""} value={""}>
                (None)
              </option>
              {instrumentQuery.data?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </TextInput>
          </label>
        </div>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Dismiss</PrimaryNagativeButton>
        <PrimaryButton onClick={handleSubmit}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

function PatientRegisterDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const ethnicityQuery = useQuery({
    queryKey: ["ethnicity"],
    queryFn: getEthnicityList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: registerPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient"] });
      alert("patient added");
      setOpen(false);
    },
    onError: () => alert("An error occured"),
  });

  const registration = useRef("");

  const [ethnicityId, setEthnicityId] = useState("");
  const dateOfBirth = useRef("");
  const [isMale, setIsMale] = useState(true);

  const { user } = useContext(UserContext);
  useEffect(() => {
    if (ethnicityQuery.isSuccess) {
      const first = ethnicityQuery.data?.[0];
      setEthnicityId(
        user?.healthcare_professional?.default_ethnicity_id ?? first?.id
      );
    }
  }, [ethnicityQuery.isSuccess]);
  useEffect(() => {
    if (user?.healthcare_professional?.default_ethnicity_id)
      setEthnicityId(user?.healthcare_professional?.default_ethnicity_id);
  }, [open]);

  const handleSubmit = () => {
    if (!registration.current) {
      alert("Missing field: registraion #");
      return;
    }
    if (!dateOfBirth.current) {
      alert("Missing field: date of birth");
      return;
    }
    const data = {
      registration_number: registration.current,
      ethnicity_id: ethnicityId,
      date_of_birth: dateOfBirth.current,
      sex: (isMale ? "male" : "female") as "male" | "female",
    };
    mutation.mutate(data);
  };

  return (
    <Dialog fullWidth={true} open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Register patient</DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label>
            Registration #:
            <TextInput
              placeholder="Registration #"
              onChange={(e) => (registration.current = e.target.value)}
            ></TextInput>
          </label>
          <label>
            Ethnicity:
            <TextInput
              as="select"
              value={ethnicityId}
              onChange={(e) => setEthnicityId(e.target.value)}
            >
              {ethnicityQuery.data?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </TextInput>
          </label>

          <label>
            Date of birth:
            <TextInput
              type="date"
              onChange={(e) => (dateOfBirth.current = e.target.value)}
            />
          </label>
          <label>
            <p>Sex:</p>
            <label>
              male
              <input
                type="radio"
                checked={isMale}
                onClick={() => setIsMale(true)}
              />
            </label>
            <span> </span>
            <label>
              female
              <input
                type="radio"
                checked={!isMale}
                onClick={() => setIsMale(false)}
              />
            </label>
          </label>
        </div>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={() => setOpen(false)}>
          Dismiss
        </PrimaryNagativeButton>
        <PrimaryButton onClick={handleSubmit}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

const GridDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
`;

function PatientList({ search }: { search: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patientQuery = useQuery({
    queryKey: ["patient"],
    queryFn: getPatients,
  });
  const deletePatientMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient"] });
      setIsDeleteConfirmDialogOpen(false);
    },
    onError: () => alert("An error occured"),
  });

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
    useState(false);
  const [deleteTargetPatient, setDeleteTargetPatient] = useState<any>();

  return (
    <>
      <GridDiv>
        {patientQuery.data
          ?.filter((patient: any) =>
            patient.registration_number.includes(search)
          )
          ?.map((patient: any) => (
            <PatientCard
              key={patient.id}
              registration={patient.registration_number}
              dateOfBirth={patient.date_of_birth.split("T")[0]}
              sex={patient.sex === "male" ? "M" : "F"}
              onClick={() => navigate(`/chart/${patient.id}?edit=true`)}
              onDelete={() => {
                setDeleteTargetPatient(patient);
                setIsDeleteConfirmDialogOpen(true);
              }}
            />
          ))}
      </GridDiv>
      {deleteTargetPatient && (
        <ConfirmDialog
          title="Confirm deletion"
          content={
            <>
              Are you sure you want to delete patient with registration number:
              <br />
              {deleteTargetPatient.registration_number}
              <br />
              <br />
              All records associated with the patient will be gone forever!
            </>
          }
          open={isDeleteConfirmDialogOpen}
          onClose={() => setIsDeleteConfirmDialogOpen(false)}
          onConfirm={() => {
            deletePatientMutation.mutate(deleteTargetPatient.id);
          }}
        />
      )}
    </>
  );
}
