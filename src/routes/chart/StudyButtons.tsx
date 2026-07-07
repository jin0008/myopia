import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import {
  enrollPatient,
  getAvailableStudies,
  getEnrollments,
} from "../../api/study";

/**
 * Study enrolment controls shown at the top-left of the chart page.
 * - One activated button per study the patient is already enrolled in
 *   (navigates to that study's visit data-entry page).
 * - A "연구 등록" button — shown only when the caller's hospital has at least
 *   one study available that this patient isn't enrolled in yet — opens a
 *   popup to pick a study and enrol the patient.
 */
export function StudyButtons({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const enrollmentsQuery = useQuery({
    queryKey: ["study", "enrollment", patientId],
    queryFn: () => getEnrollments(patientId),
    enabled: !!patientId,
    retry: false,
  });

  const availableQuery = useQuery({
    queryKey: ["study", "available"],
    queryFn: getAvailableStudies,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: (studyId: string) => enrollPatient(studyId, patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study", "enrollment", patientId],
      });
      setDialogOpen(false);
    },
    onError: (e: any) => alert(e?.message ?? "연구 등록에 실패했습니다."),
  });

  const enrollments = enrollmentsQuery.data ?? [];
  const enrolledStudyIds = new Set(enrollments.map((e) => e.study_id));
  const available = (availableQuery.data ?? []).filter(
    (s) => !enrolledStudyIds.has(s.id),
  );

  const showEnrollButton = available.length > 0;

  // Nothing to show: no enrolments and no studies available to enrol into.
  if (enrollments.length === 0 && !showEnrollButton) return null;

  const closeMenu = () => setAnchorEl(null);

  const enrolledNames = enrollments.map((e) => e.study.name);
  const buttonLabel = enrolledNames.length
    ? `연구 (${enrolledNames.length}): ${enrolledNames.join(", ")}`
    : "연구";

  return (
    <div style={{ marginTop: 8 }}>
      <PrimaryButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        title={enrolledNames.join(", ")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          maxWidth: 380,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {buttonLabel}
        </span>
        <span aria-hidden>▾</span>
      </PrimaryButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {enrollments.map((e) => (
          <MenuItem
            key={e.id}
            onClick={() => {
              closeMenu();
              navigate(`/study-visit/${e.id}`);
            }}
          >
            {e.study.name}
          </MenuItem>
        ))}

        {enrollments.length > 0 && showEnrollButton && <Divider />}

        {showEnrollButton && (
          <MenuItem
            onClick={() => {
              closeMenu();
              setDialogOpen(true);
            }}
          >
            + 연구 등록
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
      >
        <DialogTitle>연구 선택</DialogTitle>
        <DialogContent>
          {available.length === 0 ? (
            <p>등록 가능한 연구가 없습니다.</p>
          ) : (
            <List>
              {available.map((s) => (
                <ListItemButton
                  key={s.id}
                  onClick={() => enrollMutation.mutate(s.id)}
                >
                  <ListItemText
                    primary={s.name}
                    secondary={s.code ?? undefined}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <PrimaryNagativeButton onClick={() => setDialogOpen(false)}>
            취소
          </PrimaryNagativeButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
