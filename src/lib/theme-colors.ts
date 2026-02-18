// Maps seller theme_color to Tailwind class groups
export const themeColorMap: Record<string, {
  btn: string;
  btnHover: string;
  text: string;
  border: string;
  bg: string;
  bgLight: string;
  tab: string;
  tabBorder: string;
  pill: string;
  pillActive: string;
  gradient: string;
}> = {
  indigo: {
    btn: "bg-indigo-600",
    btnHover: "hover:bg-indigo-700",
    text: "text-indigo-600",
    border: "border-indigo-300",
    bg: "bg-indigo-50",
    bgLight: "bg-indigo-50/50",
    tab: "text-indigo-600",
    tabBorder: "border-indigo-600",
    pill: "border-indigo-300 bg-indigo-50 text-indigo-700",
    pillActive: "border-indigo-300 bg-indigo-50 text-indigo-700",
    gradient: "from-indigo-500 to-slate-400",
  },
  emerald: {
    btn: "bg-emerald-600",
    btnHover: "hover:bg-emerald-700",
    text: "text-emerald-600",
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    bgLight: "bg-emerald-50/50",
    tab: "text-emerald-600",
    tabBorder: "border-emerald-600",
    pill: "border-emerald-300 bg-emerald-50 text-emerald-700",
    pillActive: "border-emerald-300 bg-emerald-50 text-emerald-700",
    gradient: "from-emerald-500 to-slate-400",
  },
  rose: {
    btn: "bg-rose-600",
    btnHover: "hover:bg-rose-700",
    text: "text-rose-600",
    border: "border-rose-300",
    bg: "bg-rose-50",
    bgLight: "bg-rose-50/50",
    tab: "text-rose-600",
    tabBorder: "border-rose-600",
    pill: "border-rose-300 bg-rose-50 text-rose-700",
    pillActive: "border-rose-300 bg-rose-50 text-rose-700",
    gradient: "from-rose-500 to-slate-400",
  },
  amber: {
    btn: "bg-amber-600",
    btnHover: "hover:bg-amber-700",
    text: "text-amber-600",
    border: "border-amber-300",
    bg: "bg-amber-50",
    bgLight: "bg-amber-50/50",
    tab: "text-amber-600",
    tabBorder: "border-amber-600",
    pill: "border-amber-300 bg-amber-50 text-amber-700",
    pillActive: "border-amber-300 bg-amber-50 text-amber-700",
    gradient: "from-amber-500 to-slate-400",
  },
  violet: {
    btn: "bg-violet-600",
    btnHover: "hover:bg-violet-700",
    text: "text-violet-600",
    border: "border-violet-300",
    bg: "bg-violet-50",
    bgLight: "bg-violet-50/50",
    tab: "text-violet-600",
    tabBorder: "border-violet-600",
    pill: "border-violet-300 bg-violet-50 text-violet-700",
    pillActive: "border-violet-300 bg-violet-50 text-violet-700",
    gradient: "from-violet-500 to-slate-400",
  },
  slate: {
    btn: "bg-slate-700",
    btnHover: "hover:bg-slate-800",
    text: "text-slate-700",
    border: "border-slate-300",
    bg: "bg-slate-50",
    bgLight: "bg-slate-50/50",
    tab: "text-slate-700",
    tabBorder: "border-slate-700",
    pill: "border-slate-300 bg-slate-100 text-slate-700",
    pillActive: "border-slate-400 bg-slate-200 text-slate-800",
    gradient: "from-slate-500 to-slate-400",
  },
};

export function getTheme(color: string) {
  return themeColorMap[color] || themeColorMap.indigo;
}
