import { createFileRoute } from "@tanstack/react-router";
import * as tsparticles from "@tsparticles/engine";
import {
  useContext,
  useState,
} from "react";

import {
  DiscordIconSrc,
  GoogleIconSrc,
  PatchKitLogoSrc,
} from "@/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { TypographyH2 } from "@/components/ui/typography-h2";
import { TypographyMuted } from "@/components/ui/typography-muted";
import { TypographySmall } from "@/components/ui/typography-small";
import { ParticlesComponentContext } from "@/contexts/particles-component-context";
import { ThemeVariantContext } from "@/contexts/theme-variant-context";
import { UserContext } from "@/contexts/user-context";
import { ThemeVariant } from "@/lib/theme-variant";

export const Route = createFileRoute("/user-is-not-authenticated/")({
  component: RouteComponent,
});

function getBackgroundParticlesOptions(
  {
    themeVariant,
  }: {
    themeVariant: ThemeVariant;
  },
): tsparticles.ISourceOptions {
  return {
    fullScreen: false,
    background: {
    },
    particles: {
      color: {
        value: themeVariant === ThemeVariant.Dark ? "#ffffff" : "#000000",
      },
      number: {
        value: 150,
      },
      move: {
        direction: tsparticles.MoveDirection.none,
        enable: true,
        outModes: {
          default: tsparticles.OutMode.bounce,
        },
        random: true,
        speed: 0.5,
        straight: false,
      },
      opacity: {
        animation: {
          enable: true,
          speed: 0.75,
          sync: false,
        },
        value: { min: 0, max: 0.75 },
      },
      size: {
        value: { min: 1, max: 3 },
      },
    },
    themes: [
      {
        default: {
          mode: "dark",
          value: true,
        },
        options: {
          particles: {
            color: {
              value: "#000000",
            },
          },
        },
      },
      {
        default: {
          mode: "light",
          value: true,
        },
        options: {
          particles: {
            color: {
              value: "#ffffff",
            },
          },
        },
      },
    ],
  };
}

const BACKGROUND_PARTICLES_DARK_THEME_OPTIONS = getBackgroundParticlesOptions({
  themeVariant: ThemeVariant.Dark,
});

const BACKGROUND_PARTICLES_LIGHT_THEME_OPTIONS = getBackgroundParticlesOptions({
  themeVariant: ThemeVariant.Light,
});

function RouteComponent() {
  const { themeVariant } = useContext(ThemeVariantContext);

  const {
    signInUserWithCredentialsMutation,
    startSignInUserWithGoogleTaskMutation,
  } = useContext(UserContext);

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const { ParticlesComponent } = useContext(ParticlesComponentContext);

  return (
    <div className="grid size-full animate-fade grid-cols-2 animate-duration-500 animate-ease-in">
      <div className="flex flex-col items-center justify-center">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <TypographyH2>Welcome!</TypographyH2>
            <TypographyMuted>
              Enter your credentials to login to your account.
            </TypographyMuted>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="font-mono"
                required
                value={userEmail}
                onChange={(e) => { setUserEmail(e.target.value); }}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <TypographySmall className="ml-auto">
                  <a
                    href="https://patchkit.net"
                    className="underline"
                  >
                    Forgot your password?
                  </a>
                </TypographySmall>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={userPassword}
                onChange={(e) => { setUserPassword(e.target.value); }}
              />
            </div>
            <Button
              className="relative w-full"
              disabled={signInUserWithCredentialsMutation.isPending}
              onClick={() => signInUserWithCredentialsMutation.mutateAsync({
                userCredentials: { email: userEmail, password: userPassword },
              })}
            >
              {
                signInUserWithCredentialsMutation.isPending
                  ? <Spinner />
                  : <>Login</>
              }
            </Button>
          </div>
          <TypographySmall className="text-center">
            Don&apos;t have an account?
            {" "}
            <a href="https://patchkit.net" className="underline">
              Sign up
            </a>
          </TypographySmall>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <Separator />
            <TypographyMuted className="text-center">Or continue with</TypographyMuted>
            <Separator />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Button
              className="w-full"
              disabled={startSignInUserWithGoogleTaskMutation.status === `pending`}
              onClick={async () => {
                await startSignInUserWithGoogleTaskMutation.mutateAsync();
              }}
            >
              <img className="size-5" src={GoogleIconSrc} />
            </Button>
            <Button className="w-full">
              <img className="size-5" src={DiscordIconSrc} />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <ParticlesComponent
          className="size-full"
          options={
            themeVariant === ThemeVariant.Dark
              ? BACKGROUND_PARTICLES_DARK_THEME_OPTIONS
              : BACKGROUND_PARTICLES_LIGHT_THEME_OPTIONS
          }
        />
        <div className="absolute left-0 top-0 flex size-full items-center justify-center">
          <img className="w-96 animate-fade-up animate-delay-500 animate-duration-[2s] animate-ease-in-out dark:invert" src={PatchKitLogoSrc}></img>
        </div>
      </div>
    </div>
  );
};
