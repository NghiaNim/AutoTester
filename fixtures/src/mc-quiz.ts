/** Sample tests for the mc-quiz pack: one author, one format, three sittings. Subject: cell biology. */

export type McQuestion = { stem: string; options: [string, string, string, string] };
export type McQuiz = { file: string; title: string; questions: McQuestion[] };

export const MC_COURSE = "BIOL 101 — Introductory Biology";
export const MC_NAME_LINE = "Name: ______________________    Section: ______    Time: 25 minutes    Total: 20 points";
export const MC_INSTRUCTIONS =
  "Instructions: Choose the ONE best answer for each question. Circle the letter of your choice. Each question is worth 1 point.";

const q = (stem: string, a: string, b: string, c: string, d: string): McQuestion => ({ stem, options: [a, b, c, d] });

export const MC_QUIZZES: McQuiz[] = [
  {
    file: "quiz-3-cell-structure.docx",
    title: "Unit Quiz 3: Cell Structure",
    questions: [
      q("Which organelle is the primary site of ATP production in eukaryotic cells?", "Golgi apparatus", "Mitochondrion", "Lysosome", "Smooth endoplasmic reticulum"),
      q("Which structure is found in plant cells but not in animal cells?", "Ribosome", "Plasma membrane", "Cell wall", "Mitochondrion"),
      q("What is the main function of ribosomes?", "Protein synthesis", "Lipid synthesis", "DNA replication", "Breakdown of worn-out organelles"),
      q("A student observes a cell with no nucleus and no membrane-bound organelles. The cell is most likely a:", "Fungal cell", "Plant cell", "Protist", "Prokaryote"),
      q("All of the following are part of the endomembrane system EXCEPT the:", "Golgi apparatus", "Rough endoplasmic reticulum", "Mitochondrion", "Lysosome"),
      q("Which organelle modifies, sorts and packages proteins for export from the cell?", "Nucleolus", "Golgi apparatus", "Peroxisome", "Centrosome"),
      q("Where in a eukaryotic cell are ribosomal subunits assembled?", "Cytosol", "Rough endoplasmic reticulum", "Golgi apparatus", "Nucleolus"),
      q("Which cytoskeletal element is built from the protein actin?", "Microfilaments", "Microtubules", "Intermediate filaments", "Centrioles"),
      q("A cell that secretes large amounts of protein would be expected to contain an unusually large amount of:", "Smooth endoplasmic reticulum", "Lysosomes", "Rough endoplasmic reticulum", "Chloroplasts"),
      q("Which of the following is NOT a function of the smooth endoplasmic reticulum?", "Lipid synthesis", "Detoxification of drugs", "Storage of calcium ions", "Synthesis of secreted proteins"),
      q("The fluid-filled region of a chloroplast that surrounds the thylakoids is called the:", "Matrix", "Stroma", "Lumen", "Cytosol"),
      q("Which organelle contains hydrolytic enzymes that digest macromolecules?", "Peroxisome", "Ribosome", "Lysosome", "Nucleus"),
      q("What is the main function of the central vacuole in a mature plant cell?", "Storing water and maintaining turgor pressure", "Producing ATP", "Synthesizing proteins", "Capturing light energy"),
      q("A student stains a cell and sees a network of membranes studded with ribosomes. The student is most likely looking at the:", "Golgi apparatus", "Nuclear envelope", "Smooth endoplasmic reticulum", "Rough endoplasmic reticulum"),
      q("All of the following contain their own DNA EXCEPT:", "Mitochondria", "Lysosomes", "Chloroplasts", "The nucleus"),
      q("Which structures organize the mitotic spindle in animal cells?", "Centrosomes", "Ribosomes", "Peroxisomes", "Vacuoles"),
      q("Which cell junction lets small molecules pass directly between adjacent animal cells?", "Tight junctions", "Desmosomes", "Gap junctions", "Plasmodesmata"),
      q("According to cell theory, new cells arise from:", "Nonliving matter", "Pre-existing cells", "Free organelles", "Viruses"),
      q("A student wonders why most cells are microscopic. The best explanation is that as a cell grows, its:", "Nucleus stops working", "Membrane becomes thicker", "DNA is diluted", "Surface-area-to-volume ratio decreases"),
      q("Which of the following is NOT found in prokaryotic cells?", "Ribosomes", "Plasma membrane", "Nuclear envelope", "DNA"),
    ],
  },
  {
    file: "quiz-4-membranes.docx",
    title: "Unit Quiz 4: Membranes and Transport",
    questions: [
      q("Which molecule forms the basic bilayer of the plasma membrane?", "Cholesterol", "Phospholipid", "Glycogen", "Cellulose"),
      q("The movement of water across a selectively permeable membrane is called:", "Osmosis", "Active transport", "Endocytosis", "Facilitated diffusion"),
      q("A red blood cell is placed in a hypertonic solution. What happens to the cell?", "It swells and bursts", "It stays the same size", "It shrinks as water leaves", "It begins to divide"),
      q("Which type of transport requires energy from ATP?", "Simple diffusion", "Osmosis", "Facilitated diffusion", "Active transport"),
      q("All of the following can cross the lipid bilayer by simple diffusion EXCEPT:", "Oxygen", "Sodium ions", "Carbon dioxide", "Small nonpolar molecules"),
      q("What is the role of cholesterol in animal cell membranes?", "Keeping membrane fluidity stable as temperature changes", "Transporting glucose into the cell", "Storing genetic information", "Producing ATP"),
      q("In one cycle, the sodium-potassium pump moves:", "2 sodium ions out and 3 potassium ions in", "3 sodium ions in and 2 potassium ions out", "3 sodium ions out and 2 potassium ions in", "Equal numbers of both ions out"),
      q("A student places a plant cell in distilled water. The cell does not burst because of its:", "Central vacuole", "Cell wall", "Chloroplasts", "Plasma membrane"),
      q("Which process brings large particles into a cell by engulfing them?", "Exocytosis", "Osmosis", "Diffusion", "Phagocytosis"),
      q("Which of the following is NOT a component of the fluid mosaic model?", "Phospholipids", "Integral proteins", "Ribosomal RNA", "Cholesterol"),
      q("Channel proteins that speed the movement of water across a membrane are called:", "Aquaporins", "Ion pumps", "Carrier lipids", "Glycolipids"),
      q("Molecules move from an area of high concentration to an area of low concentration during:", "Active transport", "Diffusion", "Endocytosis", "Phagocytosis"),
      q("Which term describes a solution with the same solute concentration as the cell?", "Hypertonic", "Hypotonic", "Isotonic", "Saturated"),
      q("A student measures faster diffusion after heating a solution. The best explanation is that heating:", "Makes the molecules larger", "Removes the concentration gradient", "Thickens the membrane", "Increases the kinetic energy of the molecules"),
      q("All of the following are examples of passive transport EXCEPT:", "Osmosis", "Simple diffusion", "The sodium-potassium pump", "Facilitated diffusion"),
      q("Which part of a phospholipid is hydrophobic?", "The phosphate group", "The fatty acid tails", "The glycerol backbone", "The entire molecule"),
      q("Insulin leaves pancreatic cells in vesicles that fuse with the plasma membrane. This process is called:", "Exocytosis", "Pinocytosis", "Osmosis", "Phagocytosis"),
      q("What is the main role of the carbohydrate chains on the outer surface of the membrane?", "Storing energy", "Pumping ions", "Cell-to-cell recognition", "Anchoring the cytoskeleton"),
      q("In receptor-mediated endocytosis, the cell takes in:", "Any molecule in the surrounding fluid", "Only water", "Whole neighboring cells", "Specific molecules that bind to receptors"),
      q("Which of the following does NOT affect the rate of diffusion across a membrane?", "Temperature", "The number of ribosomes in the cytosol", "The concentration gradient", "Membrane surface area"),
    ],
  },
  {
    file: "quiz-5-energy.docx",
    title: "Unit Quiz 5: Cellular Energy",
    questions: [
      q("Where in the cell does glycolysis take place?", "Mitochondrial matrix", "Inner mitochondrial membrane", "Cytosol", "Nucleus"),
      q("What is the net yield of ATP from glycolysis for one molecule of glucose?", "2", "4", "32", "36"),
      q("Which molecule is the final electron acceptor in the electron transport chain?", "Carbon dioxide", "Oxygen", "NADH", "Water"),
      q("A student seals yeast in a flask with sugar and no oxygen. The yeast will produce:", "Lactate and water", "Glucose and oxygen", "Pyruvate only", "Ethanol and carbon dioxide"),
      q("All of the following are products of the light reactions EXCEPT:", "ATP", "NADPH", "Glucose", "Oxygen"),
      q("Where does the Calvin cycle occur?", "Stroma", "Thylakoid membrane", "Thylakoid lumen", "Cytosol"),
      q("Which pigment is the main light-absorbing molecule in plants?", "Carotene", "Xanthophyll", "Anthocyanin", "Chlorophyll a"),
      q("The citric acid cycle takes place in the:", "Cytosol", "Mitochondrial matrix", "Intermembrane space", "Stroma"),
      q("Which enzyme fixes carbon dioxide in the Calvin cycle?", "ATP synthase", "Hexokinase", "Rubisco", "Catalase"),
      q("Which of the following is NOT an input of aerobic cellular respiration?", "Glucose", "Oxygen", "ADP", "Carbon dioxide"),
      q("Protons flow back into the mitochondrial matrix through:", "ATP synthase", "Cytochrome c", "Aquaporins", "NADH dehydrogenase"),
      q("During lactic acid fermentation, pyruvate is converted to:", "Ethanol", "Acetyl CoA", "Lactate", "Glucose"),
      q("Which gas is released when water is split in photosystem II?", "Carbon dioxide", "Oxygen", "Hydrogen", "Nitrogen"),
      q("A student shines only green light on a plant and measures very little photosynthesis. The best explanation is that chlorophyll:", "Absorbs green light too strongly", "Is destroyed by green light", "Converts green light to heat", "Reflects most green light"),
      q("All of the following occur inside mitochondria EXCEPT:", "The citric acid cycle", "Glycolysis", "The electron transport chain", "Pyruvate oxidation"),
      q("Which molecule carries high-energy electrons to the electron transport chain?", "NADH", "ATP", "Pyruvate", "Carbon dioxide"),
      q("Photosynthesis uses carbon dioxide and water to make:", "ATP and ethanol", "Lactate and oxygen", "Glucose and oxygen", "Pyruvate and NADH"),
      q("How many molecules of carbon dioxide are released in one turn of the citric acid cycle?", "1", "2", "3", "6"),
      q("What is the main purpose of fermentation?", "Producing oxygen for the cell", "Building glucose from carbon dioxide", "Pumping protons across a membrane", "Regenerating NAD+ so glycolysis can continue"),
      q("Which of the following does NOT increase the rate of photosynthesis?", "Higher light intensity", "Removing all water from the plant", "More carbon dioxide", "A moderately warmer temperature"),
    ],
  },
];
