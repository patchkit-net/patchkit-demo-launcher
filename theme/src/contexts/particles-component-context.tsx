import * as tsparticles from "@tsparticles/react";
import * as tsparticlesSlim from "@tsparticles/slim";
import {
  createContext,
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";

const FakeParticlesComponent: typeof tsparticles.Particles = () => <></>;

interface ParticlesComponentContextValue {
  ParticlesComponent: typeof tsparticles.Particles;
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const ParticlesComponentContext = createContext<ParticlesComponentContextValue>(undefined!);

export function ParticlesComponentContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isParticlesEngineReady, setIsParticlesEngineReady] = useState<boolean>(false);

  useEffect(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      tsparticles.initParticlesEngine(
        async (particlesEngine) => {
          await tsparticlesSlim.loadSlim(particlesEngine);
        },
      ).then(() => { setIsParticlesEngineReady(true); });
    },
    [],
  );

  const particlesComponentContextValue = useMemo<ParticlesComponentContextValue>(
    () => {
      return {
        ParticlesComponent: isParticlesEngineReady ? memo(tsparticles.Particles) : FakeParticlesComponent,
      };
    },
    [
      isParticlesEngineReady,
    ],
  );

  return (
    <ParticlesComponentContext.Provider value={particlesComponentContextValue}>
      {children}
    </ParticlesComponentContext.Provider>
  );
}
