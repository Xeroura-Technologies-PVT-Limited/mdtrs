import { scenePlate } from "@/lib/motion/plate";
import { scenes, type SceneId } from "@/lib/motion/scenes";

export function HeroPlate({ scene }: { scene: SceneId }) {
  return <div className="hero-plate" data-theme={scenes[scene].theme} aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: scenePlate(scene, "hero") }} />;
}
