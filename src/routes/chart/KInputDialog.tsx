import { useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import { TextInput } from "../../components/input";
import { KInputGrid } from "./styles";

interface KInputDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    K1: { od: number | null; os: number | null };
    K2: { od: number | null; os: number | null };
  }) => void;
  initialData: {
    K1: { od: number | null; os: number | null };
    K2: { od: number | null; os: number | null };
  };
}

export function KInputDialog({
  open,
  onClose,
  onConfirm,
  initialData,
}: KInputDialogProps) {
  const k1_od = useRef(initialData.K1.od?.toString() ?? "");
  const k1_os = useRef(initialData.K1.os?.toString() ?? "");
  const k2_od = useRef(initialData.K2.od?.toString() ?? "");
  const k2_os = useRef(initialData.K2.os?.toString() ?? "");

  const handleConfirm = () => {
    const K1 = {
      od: k1_od.current === "" ? null : parseFloat(k1_od.current),
      os: k1_os.current === "" ? null : parseFloat(k1_os.current),
    };
    const K2 = {
      od: k2_od.current === "" ? null : parseFloat(k2_od.current),
      os: k2_os.current === "" ? null : parseFloat(k2_os.current),
    };

    if (
      Number.isNaN(K1.od as number) ||
      Number.isNaN(K1.os as number) ||
      Number.isNaN(K2.od as number) ||
      Number.isNaN(K2.os as number)
    ) {
      alert("Invalid value detected");
      return;
    }
    onConfirm({ K1, K2 });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Input K value</DialogTitle>
      <DialogContent>
        <KInputGrid>
          <div></div>
          <div>OD</div>
          <div>OS</div>
          <div>K1(Diopter)</div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K1"
              defaultValue={k1_od.current}
              onChange={(e) => (k1_od.current = e.target.value)}
            />
          </div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K1"
              defaultValue={k1_os.current}
              onChange={(e) => (k1_os.current = e.target.value)}
            />
          </div>
          <div>K2(Diopter)</div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K2"
              defaultValue={k2_od.current}
              onChange={(e) => (k2_od.current = e.target.value)}
            />
          </div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K2"
              defaultValue={k2_os.current}
              onChange={(e) => (k2_os.current = e.target.value)}
            />
          </div>
        </KInputGrid>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Cancel</PrimaryNagativeButton>
        <PrimaryButton onClick={handleConfirm}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
