import { useQuery } from "@tanstack/react-query";
import { getHospitalList } from "../api/hospital";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { PrimaryButton } from "./button";
import { SearchInput } from "./input";
import { useState } from "react";

export default function HospitalSelector({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (hospital: any) => void;
}) {
  const hospitalQuery = useQuery({
    queryKey: ["hospital"],
    queryFn: getHospitalList,
  });
  const [search, setSearch] = useState("");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Select Hospital</DialogTitle>
      <DialogContent>
        <SearchInput
          style={{
            marginTop: "8px",
          }}
          placeholder="Search Hospital(by name or code)"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
        {hospitalQuery.isLoading && "Loading..."}
        {hospitalQuery.isError && "Error"}
        {hospitalQuery.isSuccess && (
          <ul>
            {hospitalQuery.data
              .filter((hospital: any) =>
                hospital.name.toLowerCase().includes(search)
              )
              .map((hospital: any) => (
                <li key={hospital.id} onClick={() => onSelect(hospital)}>
                  {hospital.name}({hospital.code})
                </li>
              ))}
          </ul>
        )}
      </DialogContent>
      <DialogActions>
        <PrimaryButton onClick={onClose}>Close</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
