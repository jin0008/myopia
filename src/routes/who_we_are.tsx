import { TopDiv } from "../components/div";
import { useQuery } from "@tanstack/react-query";
import { getHospitalList } from "../api/hospital";
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Container,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  borderRadius: (theme.shape.borderRadius as number) * 2,
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[4],
  },
}));

const CountBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  textAlign: "center",
}));

export default function WhoWeAre() {
  const { data: hospitals, isLoading } = useQuery({
    queryKey: ["hospitals"],
    queryFn: getHospitalList,
  });

  return (
    <TopDiv>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h1"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          Who We Are
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 8, maxWidth: "800px", mx: "auto" }}
        >
          We are a network of healthcare providers dedicated to managing myopia growth.
        </Typography>

        <Box sx={{ mb: 10 }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ mb: 4, fontWeight: "bold", borderLeft: "4px solid #1976d2", pl: 2 }}
          >
            Participating Hospitals
          </Typography>

          {isLoading ? (
            <Box display="flex" justifyContent="center" p={8}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={4}>
              {hospitals?.map((hospital) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={hospital.id}>
                  <StyledCard variant="outlined">
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        {/* Placeholder for Logo - using first letter with random color effect */}
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            mr: 2,
                            width: 56,
                            height: 56,
                            fontSize: "1.5rem",
                          }}
                        >
                          {hospital.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{ lineHeight: 1.2, mb: 0.5 }}
                          >
                            {hospital.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {hospital.country.name}
                          </Typography>
                        </Box>
                      </Box>
                      <CountBox>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight="medium"
                          textTransform="uppercase"
                          letterSpacing={1}
                        >
                          Patients Monitored
                        </Typography>
                        <Typography
                          variant="h4"
                          color="primary"
                          fontWeight="bold"
                          sx={{ mt: 1 }}
                        >
                          {hospital.patientCount != null ? hospital.patientCount.toLocaleString() : 0}
                        </Typography>
                      </CountBox>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Paper elevation={0} sx={{ p: 4, bgcolor: "grey.50", borderRadius: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
            About the Growth Curves
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
            You can monitor the measured axial length and compare it with normative
            growth curves by referencing datasets collected by Erasmus University
            (Rotterdam, NL), including The Generation R Study, the Avon Longitudinal
            Study of Parents and Children, and The Rotterdam Study III [1], as well
            as datasets from children in Shanghai, China [2]. These graphs help
            parents better understand the risk of myopia their children may face.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
            The reference data for Caucasian is used under the terms of the Creative
            Commons Attribution License, which permits use, distribution and
            reproduction in any medium, provided the original work is properly
            cited. The reference data for East Asian is used under the Creative
            Commons Attribution Non Commercial (CC BY-NC 4.0) license, which permits
            others to distribute, remix, adapt, build upon this work
            non-commercially, and license their derivative works on different terms,
            provided the original work is properly cited, appropriate credit is
            given, any changes made indicated, and the use is non-commercial.
          </Typography>

          <Box mt={4}>
            <Typography variant="subtitle2" gutterBottom color="text.primary">
              References
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
              1. Tideman JWL, PollingJR, Vingerling JR, et al. Axial length growth and
              the risk of developing myopia in European children. Acta Ophthalmol.
              2018;96(3):301-309.
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              2. He X, Sankaridurg P, Naduvilath T, et al. Normative data and
              percentile curves for axial length and axial length/corneal curvature in
              Chinese children and adolescents aged 4-18 years. Br J Ophthalmol.
              2023;107(2):167-175.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </TopDiv >
  );
}
