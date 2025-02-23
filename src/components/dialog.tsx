import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { PrimaryButton, PrimaryNagativeButton } from "./button";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  content: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  content,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose} color="primary">
          Cancel
        </PrimaryNagativeButton>
        <PrimaryButton onClick={onConfirm} color="primary" autoFocus>
          Confirm
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
