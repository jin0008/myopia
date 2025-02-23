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
import PatientList from "../../components/patient_list";
import { registerPatient } from "../../api/patient";
import { useNavigate } from "react-router";

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
  const navtigate = useNavigate();
  if (user == null) {
    return (
      <CenteredDivWithGap>
        You are not logged in
        <PrimaryButton onClick={() => navtigate("/login")}>
          Log in
        </PrimaryButton>
      </CenteredDivWithGap>
    );
  } else if (user.healthcare_professional == null) {
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
  return (
    <>
      <TopDiv
        style={{
          margin: "0 128px",
        }}
      >
        <PatientSearchDiv>
          <PatientSearch value={search} onChange={setSearch} />
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
    onError: () => alert("An error occured"),
  });

  const name = useRef("");
  const [countryId, setCountryId] = useState("");

  const [hospitalId, setHospitalId] = useState("");
  const hospitalName = useRef("");
  const [hospitalCountryId, setHospitalCountryId] = useState("");

  const defaultEthnicityId = useRef("");
  const defaultInstrumentId = useRef("");

  useEffect(() => {
    if (countryQuery.isSuccess) {
      const first = countryQuery.data?.[0];
      setCountryId(first.id);
      setHospitalCountryId(first.id);
    }
  }, [countryQuery.isSuccess]);

  const handleSubmit = () => {
    if (!name.current) {
      alert("Missing field: name");
      return;
    }
    if (!hospitalId && !hospitalName.current) {
      alert("Missing field: hospital name");
      return;
    }
    const hospitalData = hospitalId
      ? {
          id: hospitalId,
        }
      : {
          name: hospitalName.current,
          country_id: hospitalCountryId,
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
            Hospital:
            <TextInput
              as="select"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              <option key={""} value={""}>
                (Not in the list)
              </option>
              {hospitalQuery.data?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}({e.country.code})
                </option>
              ))}
            </TextInput>
          </label>
          {hospitalId ? null : (
            <div
              style={{
                marginLeft: "5%",
              }}
            >
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
          )}
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
                  {e.ethnicity}
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

  useEffect(() => {
    if (ethnicityQuery.isSuccess) {
      const first = ethnicityQuery.data?.[0];
      setEthnicityId(first.id);
    }
  }, [ethnicityQuery.isSuccess]);

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
                  {e.ethnicity}
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
