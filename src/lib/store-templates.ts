// Store design templates for storefront layout customization

export type StoreTemplate = {
  id: string;
  nameEn: string;
  namePt: string;
  descEn: string;
  descPt: string;
  // Layout
  layout: "grid" | "list" | "single";
  // Grid columns per breakpoint
  gridCols: { mobile: number; sm: number; lg: number };
  // Card aspect ratio class
  aspectRatio: string;
  // Image sizing
  imageSize: "sm" | "md" | "lg" | "xl";
  // Typography
  titleSize: string;
  priceSize: string;
  // Spacing
  gap: string;
  padding: string;
  // Header style
  bannerHeight: string;
  avatarSize: string;
};

export const storeTemplates: Record<string, StoreTemplate> = {
  classic: {
    id: "classic",
    nameEn: "Classic",
    namePt: "Clássico",
    descEn: "Clean grid layout with balanced spacing. Great for general retail.",
    descPt: "Layout em grelha limpo com espaçamento equilibrado. Ideal para retalho geral.",
    layout: "grid",
    gridCols: { mobile: 2, sm: 3, lg: 4 },
    aspectRatio: "aspect-square",
    imageSize: "md",
    titleSize: "text-sm",
    priceSize: "text-sm",
    gap: "gap-3",
    padding: "p-2.5 sm:p-3",
    bannerHeight: "h-[110px] sm:h-[140px]",
    avatarSize: "h-16 w-16",
  },
  boutique: {
    id: "boutique",
    nameEn: "Boutique",
    namePt: "Boutique",
    descEn: "Larger images, more whitespace, elegant feel. Perfect for fashion & beauty.",
    descPt: "Imagens maiores, mais espaço, sensação elegante. Perfeito para moda e beleza.",
    layout: "grid",
    gridCols: { mobile: 1, sm: 2, lg: 3 },
    aspectRatio: "aspect-[3/4]",
    imageSize: "lg",
    titleSize: "text-base",
    priceSize: "text-base",
    gap: "gap-5",
    padding: "p-4",
    bannerHeight: "h-[130px] sm:h-[160px]",
    avatarSize: "h-20 w-20",
  },
  catalog: {
    id: "catalog",
    nameEn: "Catalog",
    namePt: "Catálogo",
    descEn: "Compact list layout with image and info side by side. Good for many items.",
    descPt: "Layout de lista compacto com imagem e informação lado a lado. Bom para muitos itens.",
    layout: "list",
    gridCols: { mobile: 1, sm: 1, lg: 2 },
    aspectRatio: "aspect-square",
    imageSize: "sm",
    titleSize: "text-sm",
    priceSize: "text-sm",
    gap: "gap-2",
    padding: "p-3",
    bannerHeight: "h-[100px] sm:h-[120px]",
    avatarSize: "h-14 w-14",
  },
  minimal: {
    id: "minimal",
    nameEn: "Minimal",
    namePt: "Minimal",
    descEn: "Full-width single-column showcase. Ideal for premium or few items.",
    descPt: "Mostra em coluna única de largura total. Ideal para itens premium ou poucos itens.",
    layout: "single",
    gridCols: { mobile: 1, sm: 1, lg: 1 },
    aspectRatio: "aspect-[16/10]",
    imageSize: "xl",
    titleSize: "text-lg",
    priceSize: "text-lg",
    gap: "gap-6",
    padding: "p-5",
    bannerHeight: "h-[80px] sm:h-[100px]",
    avatarSize: "h-14 w-14",
  },
};

export function getTemplate(id: string): StoreTemplate {
  return storeTemplates[id] || storeTemplates.classic;
}

export function getGridClasses(template: StoreTemplate): string {
  if (template.layout === "list") {
    return `grid grid-cols-1 lg:grid-cols-2 ${template.gap}`;
  }
  if (template.layout === "single") {
    return `flex flex-col ${template.gap}`;
  }
  const { mobile, sm, lg } = template.gridCols;
  return `grid grid-cols-${mobile} sm:grid-cols-${sm} lg:grid-cols-${lg} ${template.gap}`;
}
