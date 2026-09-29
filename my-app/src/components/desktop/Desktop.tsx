import { MotionConfig } from "framer-motion";
import TopBar from "./TopBar";
import Dock from "./Dock";
import WindowManager from "./WindowManager";

export default function Desktop() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative h-screen w-screen overflow-hidden">
        {/* Top status bar (clock, quick settings, indicators) */}
        <TopBar />

        {/* Open windows render here, positioned absolutely within this layer */}
        <div className="absolute inset-0 pt-10">
          <WindowManager />
        </div>

        {/* App dock (bottom, launches apps) */}
        <Dock />
      </main>
    </MotionConfig>
  );
}
