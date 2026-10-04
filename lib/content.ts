export type CourseLevel = "Foundation" | "Professional" | "Executive";

export const site = {
  name: "AF P",
  shortName: "AF P",
  fullName: "Amgad Faried Photography",
  project: "إنسان بعين مصور",
  founder: "أمجد فريد",
  founderEn: "Amgad Faried",
  founderRole: "مصور محترف · Amgad Faried Photography",
  tagline: "Amgad Faried Photography",
  email: "info@af-academy.com",
  web: "www.af-academy.com",
  social: "@afphotography",
};

export const navLinks = [
  { label: "الفجوة", href: "#gap" },
  { label: "الـ DNA", href: "#dna" },
  { label: "الرحلة", href: "#journey" },
  { label: "الكورسات", href: "#curriculum" },
  { label: "المسابقات", href: "/competitions" },
  { label: "التصويت", href: "#public-gallery" },
  { label: "المعرض", href: "#gallery" },
  { label: "المدرّب", href: "#mentor" },
] as const;

export const hero = {
  kicker: "AF P · إنسان بعين مصور",
  headline: "العالم لا يحتاج لصور أكثر... بل يحتاج لصور تروي قصة وتصنع تأثيراً.",
  description:
    "رحلتك مش مجرد تعلم أدوات. إحنا بنبني عين مصور بتفهم الإضاءة، التكوين، واقتناص اللحظة عشان تطلع صور تنطق.",
  cta: "اكتشف الكورسات",
  ctaHref: "#curriculum",
  secondaryCta: "تصفح المعرض",
  secondaryHref: "#gallery",
  image: {
    src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=3840&q=100",
    alt: "عدسة كاميرا في استوديو مظلم",
  },
  stats: [
    { value: "كورسات احترافية", label: "" },
    { value: "مجتمع متفاعل", label: "" },
    { value: "مسابقات وتصويت", label: "" },
    { value: "دعم مستمر", label: "" },
  ],
};

export const gap = {
  kicker: "الفجوة",
  title: "في فجوة بين اللي التعليم بيعلّمه… واللي السوق طالبُه.",
  bridge:
    "AF P بتقفل الفجوة دي في مسار «إنسان بعين مصور»: بنبني عين مصور تعرف تشوف، تقرّر، وتطلّع صورة بأثر.",
  traditional: {
    title: "التعليم التقليدي",
    items: ["معلومات", "نظريات", "حفظ", "تلقين"],
  },
  market: {
    title: "سوق العمل يحتاج",
    items: ["نتائج", "مسؤولية", "حلول", "قرارات", "أثر"],
  },
};

export const dnaSteps = [
  {
    id: "think",
    en: "Think",
    ar: "فكّر",
    copy: "فكّر بعمق، اطرح الأسئلة الصح، وشوف الصورة كاملة قبل أي تصوير أو قرار.",
  },
  {
    id: "analyze",
    en: "Analyze",
    ar: "حلّل",
    copy: "حلّل المشهد والضوء والسياق — افهم ليه اللحظة دي مهمة قبل ما تضغط الزرار.",
  },
  {
    id: "decide",
    en: "Decide",
    ar: "قرّر",
    copy: "قرّر التكوين والزاوية والقصة. القرار الواضح بيفرق أكتر من أي عدة غالية.",
  },
  {
    id: "execute",
    en: "Execute",
    ar: "نفّذ",
    copy: "نفّذ بهدوء وجودة — صورة واحدة قوية أحسن من مية فريم عشوائي.",
  },
  {
    id: "measure",
    en: "Measure",
    ar: "قِس",
    copy: "قِس النتيجة: هل الصورة بتحكي؟ هل في أثر؟ راجع بمعيار واضح مش بإحساس بس.",
  },
  {
    id: "improve",
    en: "Improve",
    ar: "طوّر",
    copy: "طوّر من كل جلسة. غيّر زاوية، ضوء، أو اقتراب. التطوير عادة مش مصادفة.",
  },
  {
    id: "lead",
    en: "Lead",
    ar: "قُد",
    copy: "قُد بعينك ورؤيتك — واصنع تأثير في شغلك ومجتمعك بصور تروي قصة.",
  },
] as const;

export const journeySteps = [
  {
    id: "start",
    title: "البداية",
    subtitle: "فهم الأساسيات",
    stage: "Foundation",
    copy: "تبني عين وأساس: ضوء، تكوين، وتفكير قبل التنفيذ.",
  },
  {
    id: "apply",
    title: "التطبيق",
    subtitle: "مشاريع حقيقية",
    stage: "Execution",
    copy: "تطبّق على شغل حقيقي — مش تمارين ورقية وخلاص.",
  },
  {
    id: "pro",
    title: "الاحتراف",
    subtitle: "بناء بورتفوليو قوي",
    stage: "Professional",
    copy: "تجمع شغل يتحكى عنه: سلسلة صور لها قصة وهوية.",
  },
  {
    id: "impact",
    title: "التأثير",
    subtitle: "دخول السوق بثقة",
    stage: "Impact",
    copy: "تخش السوق بعين أوضح وثقة مبنية على شغل مش كلام.",
  },
] as const;

export type CourseModule = {
  id: string;
  number: string;
  title: string;
  englishTitle: string;
  duration: string;
  lessons: number;
  description: string;
  audience: string[];
  outcomes: string[];
  levels: CourseLevel[];
  activeLevels: CourseLevel[];
  topics: string[];
  image: {
    src: string;
    alt: string;
  };
};

export const courseLevels: CourseLevel[] = [
  "Foundation",
  "Professional",
  "Executive",
];

export const modules: CourseModule[] = [
  {
    id: "smart-start",
    number: "01",
    title: "بداية رحلتك الذكية",
    englishTitle: "Smart Journey Start",
    duration: "Foundation",
    lessons: 6,
    description:
      "مسار لبناء طريقة تفكير واضحة: افهم المشكلة، حلّل، قرّر، ونفّذ بأثر يتقاس.",
    audience: [
      "لكل اللي عايز أساس تفكير وقرار أقوى",
      "الخريجين وبداية المسيرة المهنية",
      "المحترفين اللي قراراتهم بتأثر على شغل تاني",
    ],
    outcomes: [
      "صياغة المشكلة بوضوح",
      "توليد بدائل ومقارنة عادلة",
      "معيار نجاح قابل للقياس",
    ],
    levels: courseLevels,
    activeLevels: ["Foundation"],
    topics: ["رؤية المشكلة", "بدائل القرار", "معيار النجاح", "تنفيذ ومراجعة"],
    image: {
      src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=90",
      alt: "مساحة عمل هادئة لبداية مسار ذكي",
    },
  },
  {
    id: "photographer-eye",
    number: "02",
    title: "إنسان بعين مصور",
    englishTitle: "Through a Photographer's Eye",
    duration: "Creative",
    lessons: 6,
    description:
      "كورس تصوير يعلّمك تشوف قبل ما تصوّر — تكوين، إضاءة، وقصة في كل فريم.",
    audience: [
      "لهواة ومحترفين عايزين عين أوضح",
      "صناع محتوى محتاجين قصة بصرية",
      "أي حد عايز يشوف العالم بعدسة أعمق",
    ],
    outcomes: [
      "قراءة الضوء والاتجاه",
      "تكوين بسيط وواضح",
      "حكاية بصرية في الفريم",
    ],
    levels: courseLevels,
    activeLevels: ["Foundation"],
    topics: ["شوف قبل التصوير", "اتجاه الضوء", "التكوين", "الحكاية في الفريم"],
    image: {
      src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=2400&q=90",
      alt: "مصور يلتقط لحظة بضوء طبيعي",
    },
  },
];

export const mentor = {
  name: "أمجد فريد",
  nameEn: "Amgad Faried",
  role: "المدرب · AF P · إنسان بعين مصور",
  quote: "مهمتنا ليست أن نعلمك أكثر، بل أن نجعلك تفكر أعمق، تقرر أفضل، وتُحدِث أثرًا أكبر.",
  bio: "١٧ سنة خبرة في عالم التصوير الاحترافي. أمجد مش مجرد مصور بيعلمك إعدادات الكاميرا، لكنه بينقلك خلاصة رحلة طويلة من توثيق اللحظات وصناعة التأثير البصري. في 'إنسان بعين مصور'، هدفه يبني عندك 'عين المصور' اللي بتفهم فلسفة الإضاءة، وتكوين الكادر، وإزاي تخلي صورتك تحكي قصة وتوصل رسالة من غير ولا كلمة.",
  facts: [
    { value: "فكّر", label: "قبل التنفيذ" },
    { value: "قرّر", label: "بمنطق" },
    { value: "قُد", label: "بأثر" },
  ],
  image: {
    src: "/images/amgad-faried.png",
    alt: "أمجد فريد — Amgad Faried · AF P · إنسان بعين مصور",
  },
};

export const enroll = {
  kicker: "انضم للكوميونيتي",
  headline: "رحلتك تبدأ بفكرة… ومستقبلك نصنعه معًا.",
  description:
    "في AF P ومسار «إنسان بعين مصور»، نؤمن إن العين أهم من العدسة. هنساعدك تطوّر نظرك، وتبني شغلك، وتصنع صور تروي قصة.",
  cta: "نورنا في الكوميونيتي",
  price: "تواصل للسعر",
  image: {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=3840&q=100",
    alt: "أفق مدينة ومسار صاعد",
  },
};

export type GalleryItem = {
  id: string;
  title: string;
  author: string;
  category: string;
  span: "tall" | "wide" | "square";
  image: { src: string; alt: string };
};

export const gallery: GalleryItem[] = [
  {
    id: "g1",
    title: "أول ضوء",
    author: "AF Studio",
    category: "طبيعة",
    span: "tall",
    image: {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=90",
      alt: "جبال وضوء الصباح",
    },
  },
  {
    id: "g2",
    title: "استوديو هادي",
    author: "AF Studio",
    category: "بورتريه",
    span: "square",
    image: {
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=90",
      alt: "بورتريه بإضاءة ناعمة",
    },
  },
  {
    id: "g3",
    title: "خط المدينة",
    author: "AF Studio",
    category: "مدن",
    span: "wide",
    image: {
      src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=90",
      alt: "أفق مدينة ليلاً",
    },
  },
  {
    id: "g4",
    title: "بعد المطر",
    author: "AF Studio",
    category: "طبيعة",
    span: "square",
    image: {
      src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=90",
      alt: "غابة بعد المطر",
    },
  },
  {
    id: "g5",
    title: "عين العدسة",
    author: "AF Studio",
    category: "تفاصيل",
    span: "tall",
    image: {
      src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=90",
      alt: "كاميرا وإضاءة استوديو",
    },
  },
  {
    id: "g6",
    title: "طاولة العمل",
    author: "AF Studio",
    category: "أعمال",
    span: "wide",
    image: {
      src: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=90",
      alt: "مساحة عمل أنيقة",
    },
  },
  {
    id: "g7",
    title: "لحظات الفريق",
    author: "AF Studio",
    category: "كوميونيتي",
    span: "square",
    image: {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=90",
      alt: "فريق يتعاون حول طاولة",
    },
  },
  {
    id: "g8",
    title: "ضوء الشباك",
    author: "AF Studio",
    category: "بورتريه",
    span: "tall",
    image: {
      src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=90",
      alt: "بورتريه بضوء طبيعي من الشباك",
    },
  },
  {
    id: "g9",
    title: "سماء مفتوحة",
    author: "AF Studio",
    category: "طبيعة",
    span: "wide",
    image: {
      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=90",
      alt: "منظر طبيعي واسع",
    },
  },
];

export function getModuleById(id: string | null | undefined) {
  return modules.find((module) => module.id === id) ?? modules[0];
}

export function getCourseLessons(module: CourseModule) {
  const extras = [
    "أهلاً وبداية المسار",
    "تمرين تطبيقي",
    "سؤال وجواب",
    "قفلة المسار",
  ];
  const titles = [extras[0], ...module.topics, ...extras.slice(1)];

  return titles.map((title, index) => ({
    id: `${module.id}-lesson-${index + 1}`,
    title,
    duration: ["12:04", "18:32", "22:10", "15:47", "19:05", "14:28", "16:40"][
      index % 7
    ],
  }));
}

export function getCourseMaterials(module: CourseModule) {
  return [
    { id: "notes", name: `${module.title} — ملاحظات.pdf`, size: "1.8 MB" },
    { id: "canvas", name: `${module.title} — ورقة عمل.pdf`, size: "640 KB" },
    { id: "kit", name: `${module.title} — حزمة التطبيق.zip`, size: "24 MB" },
  ];
}
