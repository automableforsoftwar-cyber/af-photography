import { getCourseLessons, modules } from "@/lib/content";
import {
  moduleLessonContent,
  type ModuleLessonContent,
  type QuizQuestion,
} from "@/lib/lms";

export type HubLesson = {
  id: string;
  title: string;
  duration: string;
  image: { src: string; alt: string };
  notes: { heading: string; body: string }[];
  quiz: QuizQuestion[];
};

export type HubSection = {
  id: string;
  number: string;
  label: string;
  shortTitle: string;
  audience: string;
  abbrev: string;
  lessons: HubLesson[];
};

export type HubPosition = {
  section: HubSection;
  lesson: HubLesson;
};

const eastern = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

function toEastern(value: number) {
  return String(value).replace(/\d/g, (digit) => eastern[Number(digit)] ?? digit);
}

const sectionMeta: Record<
  string,
  { label: string; shortTitle: string; audience: string }
> = {
  "smart-start": {
    label: "س١: بداية رحلتك الذكية",
    shortTitle: "بداية رحلتك الذكية",
    audience: "للتفكير والقرار",
  },
  "photographer-eye": {
    label: "س٢: إنسان بعين مصور",
    shortTitle: "إنسان بعين مصور",
    audience: "للعين والحكاية البصرية",
  },
};

const topicNotes: Record<string, { heading: string; body: string }[]> = {
  "أهلاً وبداية المسار": [
    {
      heading: "إزاي تستخدم المسار",
      body: "اتفرج مرة بهدوء. اتفرج تاني وورقة الشغل قدامك. الفكرة مش إنك تحفظ أكتر — الفكرة إنك تفكّر أوضح وتقرر أحسن.",
    },
  ],
  "بناء شخصية مهنية": [
    {
      heading: "الشخصية قبل المسمى",
      body: "اتفق مع نفسك: بتحل إيه؟ بتسلّم إيه؟ الناس هتعتمد عليك في إيه؟ ده أوضح من أي لقب على لينكدإن.",
    },
  ],
  "إدارة الوقت والقرارات": [
    {
      heading: "الوقت قرار",
      body: "رتّب اليوم على أهم قرار، مش على أكتر تاسكات. لو كل حاجة عاجلة، مفيش حاجة مهمة.",
    },
  ],
  "الشغل كمشروع حقيقي": [
    {
      heading: "نتيجة تتقاس",
      body: "كل أسبوع اسأل: أنجزت إيه يتقال في جملة؟ لو مفيش جملة، الشغل كان حركة من غير أثر.",
    },
  ],
  "التسويق كمهنة": [
    {
      heading: "مش بوست وبس",
      body: "التسويق فهم عميل، عرض، وقناة. الإعلان آخر حلقة — مش أولها.",
    },
  ],
  "المزيج التسويقي": [
    {
      heading: "المنتج والسعر والمكان والرسالة",
      body: "لو عنصر واحد بايظ، الحملة هتبان ذكية والنتيجة هتخيب. راجع الأربعة قبل الميزانية.",
    },
  ],
  "استراتيجية تسويقية": [
    {
      heading: "جملة واحدة تقود الشهر",
      body: "اكتب: لمين، بإيه، ليه دلوقتي. لو الجملة طويلة، الاستراتيجية مش جاهزة.",
    },
  ],
  "التفكير النقدي": [
    {
      heading: "اسأل قبل ما توافق",
      body: "إيه الدليل؟ إيه البديل؟ إيه أسوأ سيناريو؟ تلات أسئلة دول بيوفروا أسابيع تنفيذ غلط.",
    },
  ],
  "تقييم البدائل": [
    {
      heading: "معيار قبل تفضيل",
      body: "اتفق على معيار النجاح الأول، بعدين قارن البدائل. الذوق الشخصي مش معيار.",
    },
  ],
  "عقلية منهجية": [
    {
      heading: "نفس الخطوات كل مرة",
      body: "افهم، حلّل، قرّر، نفّذ، قِس. لما الخطوات تثبت، الجودة تثبت.",
    },
  ],
  "تحليل البيانات": [
    {
      heading: "اختار مؤشر واحد",
      body: "عشرة أرقام بيربكوا الاجتماع. رقم واحد مربوط بهدف بيحرّك القرار.",
    },
  ],
  "سرد البيانات": [
    {
      heading: "قصة الرقم",
      body: "الرقم، المعنى، القرار. لو قفلت عند الرقم، الناس هتنسى. لو وصلت للقرار، الناس هتتحرّك.",
    },
  ],
  "قرارات مبنية على أرقام": [
    {
      heading: "القياس مش بديل للحكم",
      body: "الأرقام بتضيّق التخمين. الحكم لسه مطلوب عشان السياق. الاتنين مع بعض.",
    },
  ],
  "قيادة فريق التسويق": [
    {
      heading: "وضوح قبل ضغط",
      body: "الفريق بيتعب من الغموض أكتر من الشغل. حدّد الدور، المؤشر، وموعد المراجعة.",
    },
  ],
  "التخطيط والميزانية": [
    {
      heading: "الميزانية فرضية",
      body: "كل بند لازم فرضية: لو صرفنا هنا، هيحصل إيه؟ من غير فرضية الصرف عادةً.",
    },
  ],
  "النمو والنتائج": [
    {
      heading: "نمو يتكرر",
      body: "النمو اللي مش مترتّب بيتكسّر. ابنِ عادة قياس أسبوعية قبل ما تزود القنوات.",
    },
  ],
  "الإعلانات الممولة": [
    {
      heading: "رسالة قبل منصة",
      body: "المنصة بتضخّم الرسالة. لو الرسالة ضعيفة، الميزانية هتسرّع الخسارة.",
    },
  ],
  "منصات الأداء": [
    {
      heading: "نفس الفرضية على أكتر من مكان",
      body: "Meta وGoogle مش هدفين. جرب نفس العرض، وقارن التكلفة والنتيجة.",
    },
  ],
  "قياس العائد": [
    {
      heading: "العائد بعد التحويل",
      body: "الإعجاب رخيص. التحويل غالي. قِس اللي الشركة بتكسب منه.",
    },
  ],
  "تصميم برامج الشركات": [
    {
      heading: "ابدأ بهدف الإدارة",
      body: "إيه السلوك اللي عايزين يتغيّر بعد ٨ أسابيع؟ البرنامج يتكتب من هنا لمش من قائمة مواضيع.",
    },
  ],
  "تطوير الفرق": [
    {
      heading: "تمرين في الشغل الحقيقي",
      body: "أحسن تدريب بيستخدم شغل الأسبوع، مش حالة متخيلة من كتاب.",
    },
  ],
  "أثر مستدام": [
    {
      heading: "متابعة بعد اليوم التدريبي",
      body: "من غير متابعة، الورشة ذكرى. حط موعد مراجعة وأثر مطلوب.",
    },
  ],
};

const topicQuizzes: Record<string, QuizQuestion> = {
  "أهلاً وبداية المسار": {
    id: "welcome-q",
    prompt: "أحسن طريقة تستخدم بيها كل جلسة:",
    options: [
      { id: "a", label: "اتفرج مرة ومتلمسش ورقة الشغل" },
      { id: "b", label: "اتفرج وبعدين جرّب الفكرة على موقفك" },
      { id: "c", label: "عدّي الفيديو واقرأ الملخص بس" },
      { id: "d", label: "تستنى أداة جديدة قبل ما تبدأ" },
    ],
    answer: "b",
  },
  "بناء شخصية مهنية": {
    id: "persona-q",
    prompt: "الشخصية المهنية الأوضح بتبان من:",
    options: [
      { id: "a", label: "لقب وظيفي طويل" },
      { id: "b", label: "جملة: بحل إيه وبسلّم إيه" },
      { id: "c", label: "عدد الكورسات في السيرة" },
      { id: "d", label: "شكل الحساب على السوشيال" },
    ],
    answer: "b",
  },
  "إدارة الوقت والقرارات": {
    id: "time-q",
    prompt: "لو كل التاسكات عاجلة، تعمل إيه؟",
    options: [
      { id: "a", label: "تحضرهم كلهم بنفس القوة" },
      { id: "b", label: "تختار أهم قرار في اليوم وتركّز عليه" },
      { id: "c", label: "تأجّل اليوم كله" },
      { id: "d", label: "تزود ساعات الشغل من غير ترتيب" },
    ],
    answer: "b",
  },
  "الشغل كمشروع حقيقي": {
    id: "project-q",
    prompt: "إزاي تعرف إن الأسبوع كان له أثر؟",
    options: [
      { id: "a", label: "حضرت كل الاجتماعات" },
      { id: "b", label: "تقدر توصف نتيجة في جملة" },
      { id: "c", label: "الرسائل في الشات كتيرة" },
      { id: "d", label: "خلّصت تاسكات صغيرة من غير ربط" },
    ],
    answer: "b",
  },
  "التسويق كمهنة": {
    id: "mkt-q",
    prompt: "التسويق في AF بيبدأ منين؟",
    options: [
      { id: "a", label: "تصميم البوست" },
      { id: "b", label: "فهم العميل والعرض والقناة" },
      { id: "c", label: "شراء إعلان فوري" },
      { id: "d", label: "تقليد منافس حرفيًا" },
    ],
    answer: "b",
  },
  "المزيج التسويقي": {
    id: "mix-q",
    prompt: "لو السعر بايظ وباقي العناصر تمام:",
    options: [
      { id: "a", label: "الحملة هتنجح أكيد" },
      { id: "b", label: "النتيجة غالبًا هتخيب" },
      { id: "c", label: "المنصة هتعوّض لوحدها" },
      { id: "d", label: "مفيش داعي تراجع" },
    ],
    answer: "b",
  },
  "استراتيجية تسويقية": {
    id: "strategy-q",
    prompt: "جملة الاستراتيجية المفيدة بتجاوب:",
    options: [
      { id: "a", label: "أنهي فلتر استخدم" },
      { id: "b", label: "لمين، بإيه، ليه دلوقتي" },
      { id: "c", label: "كام منصة هنزل عليها" },
      { id: "d", label: "مين هيصوّر المحتوى" },
    ],
    answer: "b",
  },
  "التفكير النقدي": {
    id: "critical-q",
    prompt: "قبل ما توافق على خطة، السؤال المفيد:",
    options: [
      { id: "a", label: "الخطة شكلها حلو؟" },
      { id: "b", label: "إيه الدليل والبديل وأسوأ سيناريو؟" },
      { id: "c", label: "مين نشرها الأول؟" },
      { id: "d", label: "هتعجب المدير؟" },
    ],
    answer: "b",
  },
  "تقييم البدائل": {
    id: "alts-q",
    prompt: "تقييم البدائل يبدأ بإيه؟",
    options: [
      { id: "a", label: "تفضيل شخصي سريع" },
      { id: "b", label: "معيار نجاح متفق عليه" },
      { id: "c", label: "اختيار الأرخص دايمًا" },
      { id: "d", label: "تأجيل المقارنة" },
    ],
    answer: "b",
  },
  "عقلية منهجية": {
    id: "method-q",
    prompt: "حلقة AF الأساسية:",
    options: [
      { id: "a", label: "نفّذ بعدين فكّر" },
      { id: "b", label: "افهم، حلّل، قرّر، نفّذ، قِس" },
      { id: "c", label: "انسَ القياس لو الوقت ضيق" },
      { id: "d", label: "كرّر نفس الغلط أسرع" },
    ],
    answer: "b",
  },
  "تحليل البيانات": {
    id: "analyze-q",
    prompt: "في اجتماع أداء، الأفضل:",
    options: [
      { id: "a", label: "عشرة أرقام من غير ربط" },
      { id: "b", label: "مؤشر واحد مربوط بهدف" },
      { id: "c", label: "لقطات شاشة من غير شرح" },
      { id: "d", label: "تأجيل الأرقام للأسبوع الجاي دايمًا" },
    ],
    answer: "b",
  },
  "سرد البيانات": {
    id: "story-q",
    prompt: "قصة الرقم المكتملة:",
    options: [
      { id: "a", label: "الرقم بس" },
      { id: "b", label: "الرقم ثم المعنى ثم القرار" },
      { id: "c", label: "الرأي من غير رقم" },
      { id: "d", label: "جدول طويل من غير خاتمة" },
    ],
    answer: "b",
  },
  "قرارات مبنية على أرقام": {
    id: "numbers-q",
    prompt: "الأرقام وحدها:",
    options: [
      { id: "a", label: "بتلغي الحكم البشري تمامًا" },
      { id: "b", label: "بتضيّق التخمين بس السياق لسه مطلوب" },
      { id: "c", label: "ملهاش لازمة لو عندك خبرة" },
      { id: "d", label: "كافية من غير هدف" },
    ],
    answer: "b",
  },
  "قيادة فريق التسويق": {
    id: "lead-q",
    prompt: "الفريق بيتعب أكتر من:",
    options: [
      { id: "a", label: "وضوح الدور والمؤشر" },
      { id: "b", label: "الغموض وتغيّر الأولويات كل يوم" },
      { id: "c", label: "مراجعة أسبوعية ثابتة" },
      { id: "d", label: "هدف واحد واضح" },
    ],
    answer: "b",
  },
  "التخطيط والميزانية": {
    id: "budget-q",
    prompt: "كل بند في الميزانية محتاج:",
    options: [
      { id: "a", label: "عادة السنة اللي فاتت بس" },
      { id: "b", label: "فرضية: لو صرفنا هنا هيحصل إيه" },
      { id: "c", label: "زيادة تلقائية ١٠٪" },
      { id: "d", label: "نفس رقم المنافس" },
    ],
    answer: "b",
  },
  "النمو والنتائج": {
    id: "growth-q",
    prompt: "قبل ما تزود قنوات النمو:",
    options: [
      { id: "a", label: "زود الميزانية فورًا" },
      { id: "b", label: "ثبّت عادة قياس أسبوعية" },
      { id: "c", label: "غيّر الرسالة كل يوم" },
      { id: "d", label: "وقف القياس عشان السرعة" },
    ],
    answer: "b",
  },
  "الإعلانات الممولة": {
    id: "ads-q",
    prompt: "قبل ما تشتري إعلان:",
    options: [
      { id: "a", label: "اختار أغلى منصة" },
      { id: "b", label: "ثبّت الرسالة والجمهور والعرض" },
      { id: "c", label: "انشر من غير قياس" },
      { id: "d", label: "قلّد كرياتيف المنافس حرفيًا" },
    ],
    answer: "b",
  },
  "منصات الأداء": {
    id: "platforms-q",
    prompt: "Meta وGoogle في المنهج ده:",
    options: [
      { id: "a", label: "هدفين في ذاتهم" },
      { id: "b", label: "أدوات لاختبار نفس الفرضية" },
      { id: "c", label: "بديل عن فهم العميل" },
      { id: "d", label: "كافية من غير عرض واضح" },
    ],
    answer: "b",
  },
  "قياس العائد": {
    id: "roas-q",
    prompt: "المؤشر الأقرب لأثر الشركة:",
    options: [
      { id: "a", label: "عدد الإعجابات" },
      { id: "b", label: "التحويل والعائد مقابل الإنفاق" },
      { id: "c", label: "ساعات تشغيل الحملة" },
      { id: "d", label: "عدد المنصات المشتركة" },
    ],
    answer: "b",
  },
  "تصميم برامج الشركات": {
    id: "corp-q",
    prompt: "تصميم برنامج شركة يبدأ من:",
    options: [
      { id: "a", label: "قائمة مواضيع عامة" },
      { id: "b", label: "السلوك المطلوب بعد أسابيع" },
      { id: "c", label: "عدد ساعات التدريب بس" },
      { id: "d", label: "اسم المحاضر" },
    ],
    answer: "b",
  },
  "تطوير الفرق": {
    id: "teams-q",
    prompt: "أحسن تمرين لتطوير فريق:",
    options: [
      { id: "a", label: "حالة بعيدة عن شغلهم" },
      { id: "b", label: "شغل الأسبوع الحقيقي" },
      { id: "c", label: "محاضرة من غير تطبيق" },
      { id: "d", label: "اختبار حفظ في آخر اليوم" },
    ],
    answer: "b",
  },
  "أثر مستدام": {
    id: "sustain-q",
    prompt: "عشان التدريب ما يتتنسيش:",
    options: [
      { id: "a", label: "يوم ورشة من غير متابعة" },
      { id: "b", label: "موعد مراجعة وأثر مطلوب" },
      { id: "c", label: "شهادة من غير تطبيق" },
      { id: "d", label: "تغيير الموضوع كل أسبوع من غير ربط" },
    ],
    answer: "b",
  },
};

function fallbackQuiz(title: string): QuizQuestion {
  return {
    id: `${title}-fallback`,
    prompt: `بعد «${title}»، الخطوة الصح:`,
    options: [
      { id: "a", label: "تقفل وتعتبر الموضوع خلص" },
      { id: "b", label: "تجرب الفكرة على موقف شغلك" },
      { id: "c", label: "تستنى أداة أغلى" },
      { id: "d", label: "تنسخ قرار حد تاني من غير فهم" },
    ],
    answer: "b",
  };
}

function notesFor(
  title: string,
  moduleContent: ModuleLessonContent | undefined,
  index: number,
): { heading: string; body: string }[] {
  if (index === 0 && moduleContent) {
    return moduleContent.notes;
  }
  return (
    topicNotes[title] ?? [
      {
        heading: title,
        body: "اتفرج وورقة الشغل جنبك. وقّف لما أمجد يسمي قرار — وبعدين خد القرار بنفسك في شغلك.",
      },
    ]
  );
}

function quizFor(
  title: string,
  moduleContent: ModuleLessonContent | undefined,
  index: number,
): QuizQuestion[] {
  if (index === 0 && moduleContent) {
    return moduleContent.quiz;
  }
  const topic = topicQuizzes[title];
  return topic ? [topic] : [fallbackQuiz(title)];
}

export const hubSections: HubSection[] = modules.map((module) => {
  const content = moduleLessonContent[module.id];
  const lessons = getCourseLessons(module)
    .slice(0, 4)
    .map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      duration: lesson.duration,
      image: module.image,
      notes: notesFor(lesson.title, content, index),
      quiz: quizFor(lesson.title, content, index),
    }));

  const meta = sectionMeta[module.id];
  const label =
    meta?.label ?? `س${toEastern(Number(module.number))}: ${module.title}`;
  const shortTitle = meta?.shortTitle ?? module.title;
  const audience = meta?.audience ?? module.audience[0] ?? "";

  return {
    id: module.id,
    number: module.number,
    label,
    shortTitle,
    audience,
    abbrev: `س${toEastern(Number(module.number))}`,
    lessons,
  };
});

export function findHubLesson(lessonId: string): {
  section: HubSection | undefined;
  lesson: HubLesson | undefined;
} {
  for (const section of hubSections) {
    const lesson = section.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return { section, lesson };
    }
  }
  const section = hubSections[0];
  return { section, lesson: section?.lessons[0] };
}

export function getHubSection(sectionId: string) {
  return hubSections.find((section) => section.id === sectionId) ?? hubSections[0];
}

export function getNextHubPosition(
  sectionId: string,
  lessonId: string,
): { position: HubPosition; crossedSection: boolean } | null {
  const sectionIndex = hubSections.findIndex((section) => section.id === sectionId);
  const section = hubSections[sectionIndex];
  if (!section) {
    return null;
  }

  const lessonIndex = section.lessons.findIndex((lesson) => lesson.id === lessonId);
  const nextLesson = section.lessons[lessonIndex + 1];
  if (nextLesson) {
    return { position: { section, lesson: nextLesson }, crossedSection: false };
  }

  const nextSection = hubSections[sectionIndex + 1];
  const firstLesson = nextSection?.lessons[0];
  if (nextSection && firstLesson) {
    return {
      position: { section: nextSection, lesson: firstLesson },
      crossedSection: true,
    };
  }

  return null;
}

export const hubLessonTotal = hubSections.reduce(
  (total, section) => total + section.lessons.length,
  0,
);
