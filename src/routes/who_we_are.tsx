import { TopDiv } from "../components/div";

export default function WhoWeAre() {
  return (
    <TopDiv>
      <div
        style={{
          width: "50%",
          paddingTop: "10%",
        }}
      >
        You can monitor the measured axial length and compare it with normative
        growth curves by referencing datasets collected by Erasmus University
        (Rotterdam, NL), including The Generation R Study, the Avon Longitudinal
        Study of Parents and Children, and The Rotterdam Study III [1], as well
        as datasets from children in Shanghai, China [2]. These graphs help
        parents better understand the risk of myopia their children may face.
        The reference data for Caucasian is used under the terms of the Creative
        Commons Attribution License, which permits use, distribution and
        reproduction in any medium, provided the original work is properly
        cited. The reference data for East Asian is used under the Creative
        Commons Attribution Non Commercial (CC BY-NC 4.0) license, which permits
        others to distribute, remix, adapt, build upon this work
        non-commercially, and license their derivative works on different terms,
        provided the original work is properly cited, appropriate credit is
        given, any changes made indicated, and the use is non-commercial.
        <br />
        <br />
        Reference
        <br />
        1. Tideman JWL, PollingJR, Vingerling JR, et al. Axial length growth and
        the risk of developing myopia in European children. Acta Ophthalmol.
        2018;96(3):301-309. <br />
        2. He X, Sankaridurg P, Naduvilath T, et al. Normative data and
        percentile curves for axial length and axial length/corneal curvature in
        Chinese children and adolescents aged 4-18 years. Br J Ophthalmol.
        2023;107(2):167-175.
      </div>
    </TopDiv>
  );
}
