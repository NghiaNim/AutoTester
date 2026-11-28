/** Study-material bundles. Each is on a different subject from its pack's sample tests. */

export type Slide = { title: string; bullets: string[] } | { title: string; imageRows: [string, string][] };
export type WebSection = { heading: string; paragraphs: string[]; list?: string[]; table?: [string, string][] };
export type Bundle = {
  pack: string;
  deckTitle: string;
  deckSubtitle: string;
  slides: Slide[];
  webTitle: string;
  webIntro: string;
  webSections: WebSection[];
  topicList: string[];
};

export const BUNDLES: Bundle[] = [
  {
    pack: "mc-quiz",
    deckTitle: "Plate Tectonics",
    deckSubtitle: "GEOL 110 · Lecture 7",
    slides: [
      {
        title: "From continental drift to plate tectonics",
        bullets: [
          "Alfred Wegener proposed continental drift in 1912",
          "Evidence: matching coastlines, matching rock belts, and fossils such as Mesosaurus on both sides of the Atlantic",
          "The supercontinent Pangaea began to break apart about 200 million years ago",
          "Wegener could not explain what force moved the continents",
        ],
      },
      {
        title: "Earth's outer layers",
        bullets: [
          "The lithosphere is the rigid outer shell: the crust plus the uppermost mantle",
          "It is broken into about a dozen major plates",
          "The plates ride on the weaker, ductile asthenosphere",
          "Plates move about 2 to 10 centimeters per year",
        ],
      },
      {
        title: "Divergent boundaries",
        bullets: [
          "Plates move apart and new crust forms between them",
          "Example: the Mid-Atlantic Ridge is a divergent boundary",
          "On land, divergence creates rift valleys such as the East African Rift",
        ],
      },
      {
        title: "Seafloor spreading",
        bullets: [
          "Harry Hess proposed seafloor spreading in 1962",
          "Magma rises at ridges, cools, and moves outward on both sides",
          "Vine and Matthews (1963) explained the symmetric magnetic stripes as a record of magnetic reversals",
          "The oldest ocean floor is about 180 million years old",
        ],
      },
      {
        title: "Convergent boundaries",
        bullets: [
          "Plates move toward each other",
          "Oceanic lithosphere subducts beneath continental lithosphere because it is denser",
          "Subduction creates deep trenches and volcanic arcs",
          "Continental collision built the Himalayas, where the Indian Plate meets the Eurasian Plate",
        ],
      },
      {
        title: "Transform boundaries",
        bullets: [
          "Plates slide past each other; crust is neither created nor destroyed",
          "Example: the San Andreas Fault, between the Pacific Plate and the North American Plate",
          "Movement produces frequent shallow earthquakes",
        ],
      },
      {
        title: "Key numbers",
        imageRows: [
          ["Mariana Trench", "about 11,000 m deep, the deepest point in the ocean"],
          ["Ring of Fire", "about 75% of the world's active volcanoes"],
        ],
      },
      {
        title: "Hot spots",
        bullets: [
          "The Hawaiian Islands formed over a hot spot, far from any plate boundary",
          "The plate moves over a mantle plume, so the islands get older toward the northwest",
        ],
      },
      {
        title: "What drives the plates?",
        bullets: [
          "Slab pull is considered the strongest driving force",
          "Ridge push and mantle convection also contribute",
        ],
      },
    ],
    webTitle: "Plate Tectonics: A Study Guide",
    webIntro:
      "Plate tectonics is the theory that Earth's outer shell is divided into moving plates. This guide walks through how the idea developed, the three kinds of plate boundary, and what keeps the plates in motion.",
    webSections: [
      {
        heading: "How the idea developed",
        paragraphs: [
          "In 1912 the German meteorologist Alfred Wegener argued that the continents had once been joined and had since drifted apart. He pointed to the fit of the coastlines across the Atlantic, to rock belts that line up from one continent to another, and to fossils of the freshwater reptile Mesosaurus found in both South America and Africa.",
          "Wegener named the ancient supercontinent Pangaea. Later work showed that Pangaea began to break apart about 200 million years ago. His idea was rejected for decades because he could not name a force able to move continents.",
        ],
      },
      {
        heading: "Plates and the layers beneath them",
        paragraphs: [
          "The rigid outer shell of the planet, called the lithosphere, includes the crust and the uppermost mantle. It is broken into about a dozen major plates. Beneath it lies the asthenosphere, a hot and ductile layer of the mantle that the lithosphere plates slide over.",
          "Plate motion is slow. Measurements from satellites show that plates travel roughly 2 to 10 cm per year, about as fast as fingernails grow.",
        ],
      },
      {
        heading: "Divergent boundaries and seafloor spreading",
        paragraphs: [
          "Where two plates move apart, magma rises to fill the gap and hardens into new crust. The Mid-Atlantic Ridge, which runs down the center of the Atlantic Ocean, is the best-known divergent boundary.",
          "Harry Hess, a geologist at Princeton, proposed in 1962 that the seafloor itself spreads away from these ridges. A year later Fred Vine and Drummond Matthews showed that bands of rock on either side of a ridge carry matching magnetic stripes, a record of reversals in Earth's magnetic field. Because old seafloor is eventually destroyed, the oldest ocean floor is only about 180 million years old, far younger than the continents.",
        ],
      },
      {
        heading: "Convergent boundaries",
        paragraphs: [
          "Where plates move toward each other, one usually sinks. Oceanic lithosphere is denser than continental lithosphere, so it subducts beneath the continent, forming a deep trench and a chain of volcanoes.",
          "When two continents meet, neither sinks easily and the crust crumples upward. The Himalayas are still rising where the Indian Plate pushes into the Eurasian Plate.",
        ],
        table: [
          ["Mariana Trench", "About 11,000 m deep; the deepest point in the ocean"],
          ["Ring of Fire", "Home to about 75% of the world's active volcanoes"],
        ],
      },
      {
        heading: "Transform boundaries",
        paragraphs: [
          "At a transform boundary two plates grind past each other sideways, and crust is neither made nor destroyed. California's San Andreas Fault marks the boundary between the Pacific Plate and the North American Plate, and it produces frequent shallow earthquakes.",
        ],
      },
      {
        heading: "Hot spots and driving forces",
        paragraphs: [
          "Not every volcano sits on a plate boundary. Hawaii formed over a hot spot in the middle of the Pacific Plate. As the plate moves over the plume, new islands form and older ones are carried to the northwest.",
        ],
        list: [
          "Slab pull: the weight of a sinking plate drags the rest of the plate behind it. It is considered the strongest of the driving forces.",
          "Ridge push: elevated crust at a ridge slides downhill away from it.",
          "Mantle convection: slow circulation of hot rock beneath the plates.",
        ],
      },
    ],
    topicList: [
      "Continental drift and its evidence",
      "Lithosphere, asthenosphere and plate motion",
      "Divergent boundaries",
      "Seafloor spreading and magnetic stripes",
      "Convergent boundaries and subduction",
      "Transform boundaries",
      "Hot spots",
      "Forces that drive plate motion",
    ],
  },
  {
    pack: "worked-midterm",
    deckTitle: "Describing Data and Basic Probability",
    deckSubtitle: "STAT 100 · Weeks 2 to 4",
    slides: [
      {
        title: "Measures of center",
        bullets: [
          "The mean is the sum of the values divided by the number of values",
          "Example: the data set 4, 8, 6, 5, 7 has a mean of 6",
          "The median is the middle value of the ordered data",
          "The median is resistant to outliers; the mean is not",
        ],
      },
      {
        title: "Measures of spread",
        bullets: [
          "The sample variance divides the sum of squared deviations by n − 1",
          "The standard deviation is the square root of the variance",
          "A larger standard deviation means the data are more spread out",
        ],
      },
      {
        title: "z-scores and the empirical rule",
        bullets: [
          "A z-score tells how many standard deviations a value is from the mean: z = (x − μ) / σ",
          "Empirical rule for bell-shaped data: about 68% of values lie within 1 standard deviation of the mean, 95% within 2, and 99.7% within 3",
        ],
      },
      {
        title: "Quartiles and outliers",
        bullets: [
          "The interquartile range is IQR = Q3 − Q1",
          "A value is flagged as an outlier if it lies more than 1.5 × IQR below Q1 or above Q3",
          "A boxplot shows the five-number summary",
        ],
      },
      {
        title: "Probability rules",
        bullets: [
          "Complement rule: P(not A) = 1 − P(A)",
          "Addition rule: P(A or B) = P(A) + P(B) − P(A and B)",
          "Every probability is between 0 and 1",
        ],
      },
      {
        title: "Independence and conditional probability",
        bullets: [
          "Events A and B are independent when P(A and B) = P(A) × P(B)",
          "Conditional probability: P(A | B) = P(A and B) / P(B)",
          "If A and B are independent, then P(A | B) = P(A)",
        ],
      },
      {
        title: "The binomial distribution",
        imageRows: [
          ["Binomial setting", "n independent trials, each with success probability p"],
          ["Mean", "np; with n = 20 and p = 0.3 the mean is 6"],
          ["Variance", "np(1 − p); with n = 20 and p = 0.3 the variance is 4.2"],
        ],
      },
      {
        title: "The central limit theorem",
        bullets: [
          "For large samples, the sample mean is approximately normally distributed, whatever the shape of the population",
          "Rule of thumb: the central limit theorem applies when n is at least 30",
        ],
      },
    ],
    webTitle: "Describing Data and Basic Probability: Course Notes",
    webIntro:
      "These notes cover the first statistics unit: summarizing a data set with a few numbers, spotting unusual values, and the basic rules of probability.",
    webSections: [
      {
        heading: "Center",
        paragraphs: [
          "The mean of a data set is the sum of its values divided by how many values there are. For example, the data set 4, 8, 6, 5, 7 has a mean of 6, because the values add to 30 and there are five of them.",
          "The median is the middle value once the data are put in order. One extreme value can drag the mean a long way, but it barely moves the median. For that reason the median is called resistant to outliers.",
        ],
      },
      {
        heading: "Spread",
        paragraphs: [
          "To measure spread, find how far each value is from the mean, square those deviations and add them up. The sample variance divides that total by n − 1 rather than by n.",
          "The standard deviation is the square root of the variance, which puts it back in the same units as the data.",
        ],
      },
      {
        heading: "Standardizing",
        paragraphs: [
          "A z-score measures how unusual a value is. It is computed as z = (x − μ) / σ, the distance from the mean in units of standard deviation.",
          "For bell-shaped data the empirical rule applies: about 68% of values fall within one standard deviation of the mean, about 95% within two, and about 99.7% within three.",
        ],
      },
      {
        heading: "Quartiles and outliers",
        paragraphs: [
          "The quartiles split ordered data into four equal parts. The interquartile range, IQR = Q3 − Q1, is the width of the middle half of the data.",
          "A common rule calls a value an outlier when it is more than 1.5 × IQR below Q1 or more than 1.5 × IQR above Q3.",
        ],
      },
      {
        heading: "Probability rules",
        paragraphs: ["Three rules are used constantly."],
        list: [
          "Complement rule: P(not A) = 1 − P(A).",
          "Addition rule: P(A or B) = P(A) + P(B) − P(A and B).",
          "Conditional probability: P(A | B) = P(A and B) / P(B), provided P(B) is not zero.",
        ],
      },
      {
        heading: "Independence",
        paragraphs: [
          "Two events are independent when knowing that one happened does not change the probability of the other. In symbols, A and B are independent exactly when P(A and B) = P(A) × P(B).",
        ],
      },
      {
        heading: "The binomial distribution",
        paragraphs: [
          "A binomial setting has a fixed number n of independent trials, each with the same probability p of success.",
        ],
        table: [
          ["Mean of a binomial count", "np. With n = 20 and p = 0.3, the mean is 6."],
          ["Variance of a binomial count", "np(1 − p). With n = 20 and p = 0.3, the variance is 4.2."],
        ],
      },
      {
        heading: "The central limit theorem",
        paragraphs: [
          "The central limit theorem says that the mean of a large random sample is approximately normally distributed, whatever the shape of the population. A common rule of thumb is that the approximation is good once n is at least 30.",
        ],
      },
    ],
    topicList: [
      "Mean and median",
      "Variance and standard deviation",
      "z-scores and the empirical rule",
      "Quartiles, IQR and outliers",
      "Complement and addition rules",
      "Independence and conditional probability",
      "The binomial distribution",
      "The central limit theorem",
    ],
  },
];
