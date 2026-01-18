export interface TreatmentData {
    id: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    mechanism: string;
    efficacy: string;
    imageUrl: string;
}

export const treatments: TreatmentData[] = [
    {
        id: "atropine",
        title: "Low Dose Atropine",
        shortDescription: "Eye drops that slow eye growth by affecting retinal and scleral signaling.",
        longDescription: "Low Dose Atropine is a pharmacological treatment used to control myopia progression. Unlike the high concentrations used for dilation (1%), low doses (0.01%, 0.05%) minimize side effects while maintaining efficacy. It is often the first line of defense for progressive myopia in children.",
        mechanism: "The exact mechanism is complex, but it is believed that atropine acts as a non-selective muscarinic antagonist. It does not control myopia by stopping accommodation (focusing) as previously thought. instead, it influences signaling pathways in the retina and choroid (the vascular layer of the eye). This signaling cascade ultimately instructs the sclera (the white outer coting) to reduce its remodeling and stretching, thereby slowing down the axial elongation of the eyeball.",
        efficacy: "Clinical trials like the LAMP (Low-concentration Atropine for Myopia Progression) study have shown profound results. 0.05% atropine has been shown to reduce myopia progression by approximately 67% compared to placebo over two years. Even 0.01% concentrations offer significant benefits, reducing progression by about 27-50% in various studies. It is particularly effective when started early.",
        imageUrl: "/atropine.png"
    },
    {
        id: "dims",
        title: "DIMS Spectacles (MiYOSMART)",
        shortDescription: "Specialized eyeglass lenses with hundreds of honeycomb segments to reduce eye growth.",
        longDescription: "Defocus Incorporated Multiple Segments (DIMS) technology is a breakthrough in spectacle lens design. These lenses look like regular glasses but contain a central clear zone for sharp vision and a peripheral treatment zone with a honeycomb pattern of tiny lenslets.",
        mechanism: "DIMS lenses work on the principle of 'Peripheral Myopic Defocus'. In standard glasses, peripheral light often focuses behind the retina (hyperopic defocus), which stimulates the eye to grow longer to 'catch up' to the image. DIMS lenses project light in the mid-periphery in front of the retina (myopic defocus). This acts as a powerful 'stop signal' to the eye, inhibiting axial elongation while allowing the child to see clearly through the central optical zone.",
        efficacy: "Randomized controlled trials have demonstrated exceptional efficacy. Studies indicate that DIMS lenses can slow myopia progression by 52% and reduce axial length elongation by 62% on average compared to single-vision lenses. The effect is sustained over multiple years of wear, making it a highly effective non-invasive option.",
        imageUrl: "/dims.png"
    },
    {
        id: "orthok",
        title: "Orthokeratology (Ortho-K)",
        shortDescription: "Rigid contact lenses worn overnight to reshape the cornea and correct vision.",
        longDescription: "Orthokeratology, or Ortho-K, involves wearing custom-designed rigid gas permeable contact lenses while sleeping. These lenses gently reshape the front surface of the eye (cornea) overnight, allowing the user to be glass-free during the day.",
        mechanism: "Ortho-K corrects myopia by flattening the central cornea, providing clear daytime vision. For myopia control, the key is the mid-peripheral fluid reservoir created by the lens shape. This steepens the mid-peripheral cornea, which, similar to DIMS, focuses peripheral light in front of the retina (peripheral myopic defocus). This optical signal suppresses the stimulus for eye growth.",
        efficacy: "Ortho-K is one of the most established methods for myopia control. It consistently demonstrates a slowing of axial elongation by approximately 45-50% compared to spectacles. It is particularly beneficial for active children who want to be free of glasses during sports and daily activities.",
        imageUrl: "/orthok.png"
    },
    {
        id: "halt",
        title: "HALT Technology (Stellest)",
        shortDescription: "Lenses with concentric rings of aspherical lenslets to create a volume of myopic defocus.",
        longDescription: "Highly Aspherical Lenslet Target (HALT) technology represents the newest generation of myopia control spectacle lenses. It uses a constellation of aspherical lenslets arranged in concentric rings.",
        mechanism: "Unlike DIMS which uses distinct focal points, HALT technology creates a 'Volume of Myopic Defocus'. The aspherical lenslets create a continuous signal of light in front of the retina that follows the curvature of the eye. This 3D volume of signal is hypothesized to be a stronger stop signal for eye growth than a single plane of defocus. It keeps the myopia control signal on the retina regardless of eye movement.",
        efficacy: "Clinical results for HALT lenses are impressive. A two-year clinical trial showed that when worn for at least 12 hours a day, HALT lenses slowed myopia progression by 67% and axial elongation by 60% compared to single-vision lenses. It is highly comparable to high-dose atropine in efficacy but without the side effects.",
        imageUrl: "/halt.png"
    }
];
