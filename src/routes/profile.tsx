import { useContext, useEffect, useRef, useState } from "react";
import { TopDiv } from "../components/div";
import { UserContext } from "../App";
import NotLoggedIn from "../components/not_logged_in";
import {
  getCountryList,
  getEthnicityList,
  getInstrumentList,
} from "../api/static";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TextInput } from "../components/input";
import {
  updateProfessional,
  updateProfessionalHospital,
} from "../api/healthcare_professional";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  deleteMember,
  editMember,
  getHospitalList,
  getMembers,
} from "../api/hospital";
import styled from "styled-components";
import {
  addGoogleAuth,
  addPasswordAuth,
  changePassword,
  deleteAccount,
  removeGoogleAuth,
  removePasswordAuth,
} from "../api/auth";
import { GoogleLogin } from "@react-oauth/google";
import { professionalRoleList } from "../lib/constants";
import HospitalSelector from "../components/hospital_selector";

export default function Profile() {
  const { user } = useContext(UserContext);
  if (user == null) return <NotLoggedIn />;

  return (
    <TopDiv>
      <h1 style={{ margin: "16px 0" }}>Your User Profile</h1>
      <p>
        Your user id is <strong>{user.id}</strong>
      </p>
      <UserProfile />
      {user.healthcare_professional && <ProfessionalProfile />}
      {user.healthcare_professional?.is_admin && <HospitalAdminProfile />}
    </TopDiv>
  );
}

const ProfileSettingsDiv = styled.div`
  border: 1px solid lightgray;
  padding: 16px;
  border-radius: 16px;
  margin: 16px 0;
`;

function UserProfile() {
  const { user } = useContext(UserContext);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] =
    useState(false);
  const [isAddPasswordAuthDialogOpen, setIsAddPasswordAuthDialogOpen] =
    useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false);

  const queryClient = useQueryClient();
  const addGoogleAuthMutation = useMutation({
    mutationFn: addGoogleAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
    },
    onError: (e) => {
      alert("Google auth failed: " + e.message);
    },
  });
  const deleteGoogleAuthMutation = useMutation({
    mutationFn: removeGoogleAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
    },
    onError: (e) => {
      alert("Google auth removal failed:\n" + e.message);
    },
  });
  const deletePasswordAuthMutation = useMutation({
    mutationFn: removePasswordAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
    },
    onError: (e) => {
      alert("Password auth removal failed:\n" + e.message);
    },
  });
  return (
    <ProfileSettingsDiv>
      <h2>User settings</h2>
      <div>
        <h3>Password auth</h3>
        {user.password_auth ? (
          <>
            <p>
              You are using password authentication with username :{" "}
              <strong>{user.password_auth.username}</strong>
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "end",
                gap: "16px",
              }}
            >
              <PrimaryButton
                onClick={() => setIsChangePasswordDialogOpen(true)}
              >
                Change Password
              </PrimaryButton>
              <PrimaryNagativeButton
                onClick={() => deletePasswordAuthMutation.mutate()}
              >
                Remove password auth
              </PrimaryNagativeButton>
            </div>
          </>
        ) : (
          <>
            <p>You are not using password authentication.</p>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "end",
                gap: "16px",
              }}
            >
              <PrimaryButton
                onClick={() => setIsAddPasswordAuthDialogOpen(true)}
              >
                Add password auth
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
      <ChangePasswordDialog
        open={isChangePasswordDialogOpen}
        onClose={() => setIsChangePasswordDialogOpen(false)}
      />
      <AddPasswordAuthDialog
        open={isAddPasswordAuthDialogOpen}
        onClose={() => setIsAddPasswordAuthDialogOpen(false)}
      />
      <div>
        <h3>Google auth</h3>
        {user.google_auth ? (
          <>
            <p>You are using google authentication.</p>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "end",
              }}
            >
              <PrimaryNagativeButton
                onClick={() => deleteGoogleAuthMutation.mutate()}
              >
                Remove google auth
              </PrimaryNagativeButton>
            </div>
          </>
        ) : (
          <>
            <p>You are not using google authentication.</p>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "end",
              }}
            >
              <GoogleLogin
                text="continue_with"
                onSuccess={(response) => {
                  if (response.credential)
                    addGoogleAuthMutation.mutate(response.credential);
                }}
              />
            </div>
          </>
        )}
      </div>
      <div>
        <h3>Delete account</h3>
        <div style={{ display: "flex", justifyContent: "end" }}>
          <PrimaryNagativeButton
            style={{
              backgroundColor: "red",
            }}
            onClick={() => setIsDeleteAccountDialogOpen(true)}
          >
            Delete account
          </PrimaryNagativeButton>
        </div>
        <DeleteAccountDialog
          open={isDeleteAccountDialogOpen}
          onClose={() => setIsDeleteAccountDialogOpen(false)}
        />
      </div>
    </ProfileSettingsDiv>
  );
}

function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [],
      });
    },
  });

  const memberListQuery = useQuery({
    queryKey: ["hospital", "member"],
    queryFn: getMembers,
  });

  const { user } = useContext(UserContext);
  const shouldDisplayWarning =
    user.healthcare_professional?.is_admin &&
    memberListQuery.data?.filter((e: any) => e.approved && e.is_admin)
      .length === 1;

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Delete account</DialogTitle>
      <DialogContent>
        <p style={{ color: "red" }}>Warning: This action is irreversible.</p>
        {shouldDisplayWarning && (
          <p style={{ color: "red" }}>
            Warning: You are the only admin in this hospital. If you delete your
            account, there will be no admin in this hospital.
            <br />
            We recommend you to add another admin before deleting your account.
          </p>
        )}
      </DialogContent>
      <DialogActions>
        <PrimaryButton onClick={onClose}>Cancel</PrimaryButton>
        <PrimaryNagativeButton
          onClick={() => {
            mutation.mutate();
            onClose();
          }}
        >
          Delete
        </PrimaryNagativeButton>
      </DialogActions>
    </Dialog>
  );
}

function AddPasswordAuthDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const username = useRef("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => addPasswordAuth(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
      onClose();
    },
    onError: (e) => {
      alert("Add password auth failed: " + e.message);
    },
  });

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert("Password and confirm password does not match");
      return;
    }
    mutation.mutate({ username: username.current, password });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Add password auth</DialogTitle>
      <DialogContent>
        <label>
          Username:
          <TextInput
            onChange={(e) => (username.current = e.target.value)}
          ></TextInput>
        </label>
        <label>
          Password:
          <TextInput
            autoComplete="new-password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          ></TextInput>
        </label>
        <label>
          Confirm password:
          <TextInput
            autoComplete="new-password"
            type="password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              borderColor: password !== confirmPassword ? "red" : undefined,
            }}
          ></TextInput>
        </label>
      </DialogContent>
      <DialogActions>
        <PrimaryButton onClick={onClose}>Cancel</PrimaryButton>
        <PrimaryButton onClick={handleSubmit}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
      alert("Password changed");
      onClose();
    },
    onError: (e) => {
      alert("Password change failed: " + e.message);
    },
  });

  const handleSubmit = () => {
    if (newPassword !== confirmNewPassword) {
      alert("New password and confirm password does not match");
      return;
    }
    mutation.mutate(newPassword);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Change password</DialogTitle>
      <DialogContent>
        <label>
          New password:
          <TextInput
            type="password"
            onChange={(e) => setNewPassword(e.target.value)}
          ></TextInput>
        </label>
        <label>
          Confirm new password:
          <TextInput
            type="password"
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            style={{
              borderColor:
                newPassword !== confirmNewPassword ? "red" : undefined,
            }}
          ></TextInput>
        </label>
      </DialogContent>
      <DialogActions>
        <PrimaryButton onClick={onClose}>Cancel</PrimaryButton>
        <PrimaryButton onClick={handleSubmit}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

function ProfessionalProfile() {
  const { user } = useContext(UserContext);

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
  const updateMutation = useMutation({
    mutationFn: updateProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
    },
  });

  const [isChangeHospitalDialogOpen, setIsChangeHospitalDialogOpen] =
    useState(false);

  const memberListQuery = useQuery({
    queryKey: ["hospital", "member"],
    queryFn: getMembers,
  });

  const shouldDisplayWarning =
    user.healthcare_professional.is_admin &&
    memberListQuery.data?.filter((e: any) => e.approved && e.is_admin)
      .length === 1;

  return (
    <ProfileSettingsDiv>
      <h2>Healthcare professional settings</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <p>
          Your hospital is{" "}
          <strong>
            {user.healthcare_professional.hospital.name}(Code :{" "}
            {user.healthcare_professional.hospital.code})
          </strong>
        </p>
        <PrimaryButton onClick={() => setIsChangeHospitalDialogOpen(true)}>
          Change
        </PrimaryButton>

        <ChangeHospitalDialog
          open={isChangeHospitalDialogOpen}
          onClose={() => setIsChangeHospitalDialogOpen(false)}
        />
      </div>
      {shouldDisplayWarning && (
        <p style={{ color: "red" }}>
          Warning: You are the only admin in this hospital. If you change your
          hospital, there will be no admin in this hospital.
          <br />
          We recommend you to add another admin before changing hospital.
        </p>
      )}
      <label>
        Role:
        <TextInput
          as="select"
          value={user.healthcare_professional.role}
          onChange={(e) => {
            updateMutation.mutate({
              role: e.target.value,
            });
          }}
        >
          {professionalRoleList.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </TextInput>
      </label>
      <label>
        Default ethnicity:
        <TextInput
          as="select"
          value={user.healthcare_professional.default_ethnicity_id ?? ""}
          onChange={(e) => {
            updateMutation.mutate({
              default_ethnicity_id: e.target.value || null,
            });
          }}
        >
          <option value={""}>(None)</option>
          {ethnicityQuery.data?.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </TextInput>
      </label>
      <label>
        Default instrument:
        <TextInput
          as="select"
          value={user.healthcare_professional.default_instrument_id ?? ""}
          onChange={(e) => {
            updateMutation.mutate({
              default_instrument_id: e.target.value || null,
            });
          }}
        >
          <option value={""}>(None)</option>
          {instrumentQuery.data?.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </TextInput>
      </label>
    </ProfileSettingsDiv>
  );
}

function ChangeHospitalDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [createNewHospital, setCreateNewHospital] = useState(false);
  const [hospitalCode, setHospitalCode] = useState("");
  const hospitalName = useRef("");
  const [hospitalCountryId, setHospitalCountryId] = useState("");

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

  const queryClient = useQueryClient();

  useEffect(() => {
    if (countryQuery.isSuccess) {
      const first = countryQuery.data?.[0];
      setHospitalCountryId(first?.id);
    }
  }, [countryQuery.isSuccess]);

  const mutation = useMutation({
    mutationFn: updateProfessionalHospital,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
      onClose();
    },
  });

  const hospitalId = hospitalQuery.data?.find(
    (e: any) => e.code === hospitalCode
  )?.id;

  const handleSubmit = () => {
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

    mutation.mutate(hospitalData);
  };

  const [isHospitalSelectorOpen, setIsHospitalSelectorOpen] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Change hospital</DialogTitle>
      <DialogContent>
        <label>
          Join existing hospital
          <input
            type="radio"
            checked={!createNewHospital}
            onChange={(e) => setCreateNewHospital(!e.target.checked)}
          />
        </label>
        <br />
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
            style={{
              borderColor:
                (createNewHospital && hospitalId != null) ||
                (!createNewHospital && hospitalId == null)
                  ? "red"
                  : undefined,
            }}
          ></TextInput>
        </label>
        {!createNewHospital && (
          <PrimaryButton onClick={() => setIsHospitalSelectorOpen(true)}>
            Select hospital
          </PrimaryButton>
        )}
        <HospitalSelector
          open={isHospitalSelectorOpen}
          onClose={() => setIsHospitalSelectorOpen(false)}
          onSelect={(hospital) => {
            setHospitalCode(hospital.code);
            setIsHospitalSelectorOpen(false);
          }}
        />
      </DialogContent>
      <DialogActions>
        <PrimaryButton onClick={handleSubmit}>Confirm</PrimaryButton>
        <PrimaryButton onClick={onClose}>Cancel</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

const Table = styled.table`
  text-align: center;
  & td {
    padding: 8px;
  }
`;

function HospitalAdminProfile() {
  const memberListQuery = useQuery({
    queryKey: ["hospital", "member"],
    queryFn: getMembers,
  });
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hospital", "member"],
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: {
        approved?: true;
        is_admin?: true;
      };
    }) => {
      return editMember(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hospital", "member"],
      });
    },
  });

  return (
    <ProfileSettingsDiv>
      <h2>Hospital admin settings</h2>
      <h3>Member list</h3>
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
                {user.id === e.user_id ? (
                  "You"
                ) : e.is_admin ? (
                  <></>
                ) : (
                  <PrimaryButton
                    onClick={() => deleteMutation.mutate(e.user_id)}
                  >
                    {e.approved ? "Kick" : "Reject"}
                  </PrimaryButton>
                )}
              </td>
              <td>
                {e.is_admin ? (
                  "Is admin"
                ) : !e.approved ? (
                  <></>
                ) : (
                  <PrimaryButton
                    onClick={() => {
                      if (
                        confirm(
                          "Admins can approve new member as well as kick/reject non-admin members and can't be kicked.\nAre you sure you want to set this user as admin?"
                        )
                      )
                        editMutation.mutate({
                          userId: e.user_id,
                          data: { is_admin: true },
                        });
                    }}
                  >
                    Set as admin
                  </PrimaryButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </ProfileSettingsDiv>
  );
}
