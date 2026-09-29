export type ChatAuthor = {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatar: string;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  text: string;
  time: string;
  image?: string;
};

export type CommunityChannel = {
  id: string;
  name: string;
  topic: string;
};

export const currentUser: ChatAuthor = {
  id: "you",
  name: "إنت",
  initials: "أن",
  color: "bg-yellow-700",
  avatar: "",
};

export const communityAuthors: ChatAuthor[] = [
  currentUser,
  {
    id: "elena",
    name: "أمجد فريد",
    initials: "أف",
    color: "bg-yellow-600",
    avatar: "/images/amgad-faried.png",
  },
  {
    id: "maya",
    name: "سارة حسن",
    initials: "سح",
    color: "bg-slate-700",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "jonas",
    name: "محمود علي",
    initials: "مع",
    color: "bg-slate-700",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "rina",
    name: "نورا عادل",
    initials: "نع",
    color: "bg-slate-700",
    avatar:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80",
  },
];

/** Course community — exactly two channels */
export const channels: CommunityChannel[] = [
  {
    id: "general",
    name: "عام",
    topic: "نقاش نصي عام عن الكورس والدروس",
  },
  {
    id: "photos",
    name: "الصور",
    topic: "شارك فريماتك واطلب رأي الزملاء",
  },
];

const seed: Record<string, ChatMessage[]> = {
  general: [
    {
      id: "g1",
      authorId: "elena",
      text: "أهلاً بيك في #عام — اسأل عن أي حاجة في الكورس، والناس هترد بهدوء.",
      time: "٩:١٤ ص",
    },
    {
      id: "g2",
      authorId: "maya",
      text: "خلّصت تمرين الضوء الطبيعي… حد جرّب زاوية الشباك الصبح؟",
      time: "٩:٢٢ ص",
    },
    {
      id: "g3",
      authorId: "jonas",
      text: "أيوه — قرّبت من الشباك وخفّفت الـ ISO. فرق واضح.",
      time: "٩:٢٨ ص",
    },
  ],
  photos: [
    {
      id: "ph1",
      authorId: "maya",
      text: "أول ضوء من الشباك — عايزة رأيكم في التكوين.",
      time: "١٠:١٢ ص",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=90",
    },
    {
      id: "ph2",
      authorId: "jonas",
      text: "فريم استوديو — الإضاءة ناعمة أوي؟",
      time: "١١:٤٠ ص",
      image:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=90",
    },
    {
      id: "ph3",
      authorId: "rina",
      text: "بعد المطر — حاسّة إن الهوا حوالين الموضوع ناقص شوية.",
      time: "١٢:٠٥ م",
      image:
        "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=900&q=90",
    },
  ],
};

export function getSeedMessages(channelId: string) {
  return seed[channelId] ?? [];
}

export function getAuthor(id: string) {
  return communityAuthors.find((author) => author.id === id) ?? currentUser;
}
