export type EditorialPhoto = {
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
};

function specialtyCrop(name: string, alt: string): EditorialPhoto {
  const base = "/editorial/treatments";
  const src = `${base}/${name}.webp`;
  return {
    src, alt, width: 1024, height: 683,
    srcSet: `${base}/previews/${name}-600.webp 600w, ${base}/previews/${name}-900.webp 900w, ${src} 1024w`,
  };
}

function journeyPhoto(name: string, alt: string): EditorialPhoto {
  const base = `/editorial/${name}`;
  return {
    src: `${base}.webp`, alt, width: 1536, height: 1024,
    srcSet: `${base}-768.webp 768w, ${base}.webp 1536w`,
  };
}

export const carePhotos = {
  medical: specialtyCrop("medical", "A physician and a guest review a scan together."),
  surgical: specialtyCrop("surgical", "Two masked surgeons in green gowns work together in an operating theatre."),
  dental: specialtyCrop("dental", "A dentist explains a tooth model to a seated guest."),
  rehabilitation: specialtyCrop("rehabilitation", "A physiotherapist supports a guest practising at parallel bars."),
  longevity: specialtyCrop("longevity", "A clinician checks an older guest's blood pressure."),
  holistic: specialtyCrop("holistic", "A woman meditates on a sunlit garden verandah."),
  reports: journeyPhoto("share-reports", "A guest gathers scans and medical reports beside a laptop."),
  video: journeyPhoto("video-consultation", "A specialist reviews a scan while speaking with a guest by video."),
};
