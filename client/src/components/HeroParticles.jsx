import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useReducedMotion } from "framer-motion";

export function HeroParticles() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <ParticlesProvider init={loadSlim}>
      <Particles
        className="pointer-events-none absolute inset-0"
        options={{
          fullScreen: { enable: false },
          fpsLimit: 60,
          particles: {
            color: { value: "#d9ff38" },
            links: {
              enable: true,
              color: "#d9ff38",
              opacity: 0.12,
              distance: 150,
            },
            move: { enable: true, speed: 0.55 },
            number: { value: 34, density: { enable: true } },
            opacity: { value: 0.28 },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
      />
    </ParticlesProvider>
  );
}
