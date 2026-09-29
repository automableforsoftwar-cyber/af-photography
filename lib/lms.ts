export type DashboardView = "hub" | "inbox" | "challenges" | "assignments";

export const dashboardNav: {
  id: DashboardView;
  label: string;
  hint: string;
}[] = [
  { id: "hub", label: "مركز التعلم", hint: "فيديو وشرح وكويز" },
  { id: "inbox", label: "الرسائل", hint: "المدرّب والمجموعة" },
  { id: "challenges", label: "التحديات", hint: "تنافس وترتيب" },
  { id: "assignments", label: "التسليمات", hint: "ارفع شغلك" },
];

export const resources = [
  {
    id: "canvas",
    title: "ورقة عمل اتخاذ القرار",
    meta: "PDF · صفحتين",
    tag: "تمرين",
    copy: "قالب بسيط: المشكلة، البدائل، المعيار، القرار، ومؤشر النجاح.",
  },
  {
    id: "brief",
    title: "نموذج برايف تسويقي",
    meta: "PDF · ٣ صفحات",
    tag: "مرجع",
    copy: "الجمهور، العرض، القناة، والرسالة — عشان الفريق يشتغل بنفس الجملة.",
  },
  {
    id: "metrics",
    title: "دليل مؤشرات الأداء",
    meta: "PDF · ٦ صفحات",
    tag: "تحليل",
    copy: "إيه اللي يتقاس في حملة، وإيه اللي مجرد ضوضاء.",
  },
  {
    id: "story",
    title: "حزمة سرد البيانات",
    meta: "٥ ملفات · ٨ MB",
    tag: "تطبيق",
    copy: "شرائح جاهزة: رقم، معنى، قرار. استخدمها في اجتماع الأسبوع.",
  },
];

export type InboxThread = {
  id: string;
  name: string;
  role: string;
  initials: string;
  preview: string;
  time: string;
  unread?: boolean;
  messages: { id: string; from: "them" | "you"; text: string; time: string }[];
};

export const inboxThreads: InboxThread[] = [
  {
    id: "amgad-broadcast",
    name: "أمجد فريد",
    role: "بث من المدرّب · للقراءة فقط",
    initials: "أف",
    preview: "تحديث الأسبوع: جلسة لايف الخميس ٨ مساءً.",
    time: "اليوم",
    unread: true,
    messages: [
      {
        id: "b1",
        from: "them",
        text: "أهلاً بالدفعة. الأسبوع ده هنركّز على العين قبل الكاميرا — شوف قبل ما تصوّر.",
        time: "الإثنين · ١٠:٠٠ ص",
      },
      {
        id: "b2",
        from: "them",
        text: "تذكير: ارفع فريم واحد لمسابقة الأسبوع من تبويب المسابقات قبل الجمعة.",
        time: "الثلاثاء · ٦:٣٠ م",
      },
      {
        id: "b3",
        from: "them",
        text: "تحديث الأسبوع: جلسة لايف الخميس ٨ مساءً — هنتكلم عن التكوين البسيط.",
        time: "اليوم · ٩:١٥ ص",
      },
      {
        id: "b4",
        from: "them",
        text: "ملاحظة: سؤال المحتوى → مساعد التعلم أو #عام. الرسايل دي بث مني بس — مفيش رد هنا.",
        time: "اليوم · ١١:٤٠ ص",
      },
    ],
  },
];

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  answer: string;
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "أحسن بداية لأي جلسة في AF:",
    options: [
      { id: "a", label: "تحفظ التعريفات من غير تطبيق" },
      { id: "b", label: "تفهم الفكرة وبعدين تجرّبها على موقف شغلك" },
      { id: "c", label: "تستنى أداة جديدة قبل ما تفكّر" },
      { id: "d", label: "تعدّي الفيديو وتقرأ الكومنتات بس" },
    ],
    answer: "b",
  },
  {
    id: "q2",
    prompt: "الفرق الأساسي بين التعليم التقليدي والسوق:",
    options: [
      { id: "a", label: "السوق بيطالب بمعلومات أكتر" },
      { id: "b", label: "السوق بيطالب بنتائج وقرارات وأثر" },
      { id: "c", label: "السوق بيطالب بدرجات أعلى" },
      { id: "d", label: "السوق بيطالب بحفظ أسرع" },
    ],
    answer: "b",
  },
  {
    id: "q3",
    prompt: "اتخاذ قرار ذكي يبدأ بإيه؟",
    options: [
      { id: "a", label: "أول إحساس من غير سؤال" },
      { id: "b", label: "فهم المشكلة والبدائل قبل الاختيار" },
      { id: "c", label: "نسخ قرار فريق تاني" },
      { id: "d", label: "تأجيل القرار لأجل غير مسمى" },
    ],
    answer: "b",
  },
  {
    id: "q4",
    prompt: "سرد البيانات الناجح بيعمل إيه؟",
    options: [
      { id: "a", label: "يعرض أكبر عدد جداول ممكن" },
      { id: "b", label: "يحكي رقم → معنى → قرار" },
      { id: "c", label: "يستبدل الرأي بالقياس دايمًا من غير سياق" },
      { id: "d", label: "يخبي الأرقام الضعيفة" },
    ],
    answer: "b",
  },
  {
    id: "q5",
    prompt: "التسويق الأدائي الناجح بيتقاس بإيه أولًا؟",
    options: [
      { id: "a", label: "شكل الإعلان بس" },
      { id: "b", label: "العائد والتحويل مقابل الإنفاق" },
      { id: "c", label: "عدد المنصات المشتركة" },
      { id: "d", label: "مدة الحملة من غير هدف" },
    ],
    answer: "b",
  },
];

export type Assignment = {
  id: string;
  title: string;
  due: string;
  brief: string;
  criteria: string[];
};

export const assignments: Assignment[] = [
  {
    id: "decision-memo",
    title: "مذكرة قرار",
    due: "الجمعة · الأسبوع ٤",
    brief:
      "اختار مشكلة شغلك. اكتب البدائل، المعيار، القرار، ومؤشر هتعرف بيه إنك نجحت بعد أسبوعين.",
    criteria: [
      "المشكلة مكتوبة في جملة واحدة",
      "بديلين على الأقل",
      "مؤشر نجاح قابل للقياس",
    ],
  },
  {
    id: "data-story",
    title: "قصة رقم واحد",
    due: "الجمعة · الأسبوع ٥",
    brief:
      "خد رقم من شغلك أو من حملة تجريبية، واحكيه في ٣ شرائح: الرقم، المعنى، القرار.",
    criteria: [
      "الرقم واضح ومصدره مكتوب",
      "المعنى بلغة غير تقنية",
      "قرار أو توصية في الجملة الأخيرة",
    ],
  },
];

export type ModuleLessonContent = {
  duration: string;
  notes: { heading: string; body: string }[];
  quiz: QuizQuestion[];
};

export const moduleLessonContent: Record<string, ModuleLessonContent> = {
  "career-launch": {
    duration: "18:32",
    notes: [
      {
        heading: "الدرس ده هيغطي إيه",
        body: "سنة أولى شغل: إزاي تدخل السوق بشخصية مهنية، تدير وقتك، وتتعامل مع الشغل كمشروع له نتيجة مش مجرد حضور.",
      },
      {
        heading: "خلي بالك من",
        body: "الجامعة بتديك معلومات. الشركة بتسألك: قررت إيه؟ نفّذت إيه؟ أثّرت في إيه؟ هنا بنتعلّم الإجابة.",
      },
    ],
    quiz: [quizQuestions[0], quizQuestions[1]],
  },
  "marketing-fundamentals": {
    duration: "20:14",
    notes: [
      {
        heading: "التسويق مش إعلان بس",
        body: "هنبني أساس: مين العميل، إيه العرض، وإزاي الرسالة توصل. التفكير التصميمي هنا عشان تحل مشكلة مش عشان تزيّن بوست.",
      },
      {
        heading: "طبّق وأنت بتتفرج",
        body: "اختار منتج تعرفه. اكتب جملة واحدة: بيشتريه مين، ولييه. لو الجملة ضعيفة، الاستراتيجية هتضعف وراها.",
      },
    ],
    quiz: [quizQuestions[0], quizQuestions[4]],
  },
  "decision-making": {
    duration: "22:10",
    notes: [
      {
        heading: "قرار قبل حركة",
        body: "بنفكك المشكلة، نعرض البدائل، ونختار بمعيار واضح. التخمين السريع غالي على المدى الطويل.",
      },
      {
        heading: "فكّر أكثر. اعمل أفضل.",
        body: "الأدوات مهمة، بس من غير طريقة تفكير هتفضل تنفّذ بخطة مش بتاعتك.",
      },
    ],
    quiz: [quizQuestions[2], quizQuestions[1]],
  },
  "marketing-analytics": {
    duration: "19:40",
    notes: [
      {
        heading: "الرقم من غير قصة ضوضاء",
        body: "هتتعلم تقرأ البيانات، تختار المؤشر الصح، وتحكي القرار اللي الرقم بيفرضه.",
      },
      {
        heading: "Excel وPower BI مش الهدف",
        body: "الأداة وسيلة. الهدف إن حد في الاجتماع يفهم ويعرف يعمل إيه بكرة.",
      },
    ],
    quiz: [quizQuestions[3], quizQuestions[4]],
  },
  "marketing-manager": {
    duration: "21:05",
    notes: [
      {
        heading: "من منفّذ لقائد",
        body: "مدير التسويق بيرتّب فريق، ميزانية، وأولويات. النتيجة أهم من الزحمة.",
      },
      {
        heading: "ثقافة أداء",
        body: "اتفق على مؤشرات، راجع أسبوعي، وعدّل من غير ما تكسّر الفريق.",
      },
    ],
    quiz: [quizQuestions[1], quizQuestions[2]],
  },
  "media-buying": {
    duration: "23:18",
    notes: [
      {
        heading: "صرف ذكي",
        body: "الإعلان الممول مش سباق ميزانية. هو فرضية: رسالة، جمهور، عرض، وقياس.",
      },
      {
        heading: "حسّن كل أسبوع",
        body: "Meta وGoogle أدوات. اللي بيفرق هو إنت بتقفل إيه بعد كل حملة.",
      },
    ],
    quiz: [quizQuestions[4], quizQuestions[3]],
  },
  "corporate-programs": {
    duration: "17:50",
    notes: [
      {
        heading: "تدريب بأثر",
        body: "برامج الشركات مش يوم ورشة. بنصمم مسار يغيّر سلوك الفريق ويتقاس.",
      },
      {
        heading: "من الاحتياج للنتيجة",
        body: "نبدأ بهدف الشركة، بعدين المحتوى، بعدين المتابعة. من غير المتابعة التدريب بيتنسي.",
      },
    ],
    quiz: [quizQuestions[1], quizQuestions[2]],
  },
};

export const challenge = {
  title: "تمرين الأسبوع: قرار واحد قابل للقياس",
  kicker: "تمرين المجموعة",
  closes: "مفتوح طول الأسبوع",
  brief:
    "ارفع مذكرة قصيرة: مشكلة، بديلين، قرار، ومؤشر هتقيسه بعد أسبوعين. موبايل ينفع. الفكرة أوضح من الشكل.",
};

export const leaderboard = [
  {
    rank: 1,
    name: "سارة حسن",
    work: "مذكرة قرار",
    votes: 148,
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  {
    rank: 2,
    name: "محمود علي",
    work: "قصة رقم",
    votes: 131,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    rank: 3,
    name: "نورا عادل",
    work: "حملة أداء",
    votes: 118,
    avatar:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80",
  },
  {
    rank: 4,
    name: "أمجد فريد",
    work: "برنامج فريق",
    votes: 96,
    avatar: "/images/amgad-faried.png",
  },
  {
    rank: 5,
    name: "كريم فؤاد",
    work: "بعد المطر",
    votes: 84,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    rank: 6,
    name: "هدى سالم",
    work: "خط المد",
    votes: 72,
    avatar: "",
  },
];
