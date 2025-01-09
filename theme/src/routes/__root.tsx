import {
  createRootRouteWithContext,
  Navigate,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import {
  CircleUserIcon,
  MinusIcon,
  Package2Icon,
  SunMoonIcon,
  XIcon,
} from "lucide-react";
import {
  minimizeWindow,
  startQuitTask,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  lazy,
  Suspense,
} from "react";
import {
  forwardRef,
  useContext,
  useState,
} from "react";

import {
  Button,
  ButtonProps,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { TypographyInlineCode } from "@/components/ui/typography-inline-code";
import { TypographyMuted } from "@/components/ui/typography-muted";
import { ThemeVariantContext } from "@/contexts/theme-variant-context";
import { UserContext } from "@/contexts/user-context";
import { UserAuth } from "@/lib/user-auth";
import { cn } from "@/lib/utils";

const TanStackRouterDevtoolsOnlyInDev = import.meta.env.MODE === "production"
  ? () => null
  : lazy(
    () => import("@tanstack/router-devtools").then(x => ({ default: x.TanStackRouterDevtools })),
  );

const RuntimeApiQueryClientDevToolsOnlyInDev = import.meta.env.MODE === "production"
  ? () => null
  : lazy(
    () => import("@upsoft/patchkit-launcher-runtime-api-react-theme-client").then(x => ({ default: x.RuntimeApiQueryClientDevTools })),
  );

const TitleBarMenuButton = forwardRef<HTMLButtonElement, ButtonProps & { isActive: boolean }>(
  (
    {
      isActive,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        className={cn(
          "p-0 w-auto h-8 text-muted-foreground hover:text-primary hover:no-underline",
          className,
          isActive ? "text-primary" : null,
        )}
        variant="link"
        ref={ref}
        {...props}
      />
    );
  },
);
TitleBarMenuButton.displayName = "TitleBarMenuButton";

const TitleBarWindowButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        className={cn(
          "size-8 rounded-none",
          className,
        )}
        size="icon"
        ref={ref}
        {...props}
      />
    );
  },
);
TitleBarWindowButton.displayName = "TitleBarWindowButton";

export function TitleBarLeftPanel() {
  return (
    <div
      className="app-region-no-drag flex flex-row items-center gap-6 justify-self-start px-6"
    >
      <Package2Icon className="size-4" />
    </div>
  );
}

export function TitleBarCenterPanel() {
  return (
    <div className="flex items-center justify-center justify-self-center">
      <TypographyMuted>Launcher</TypographyMuted>
    </div>
  );
}

export function TitleBarRightPanel() {
  const { toggleThemeVariantOption } = useContext(ThemeVariantContext);

  const { userAuth, signOutUserMutation } = useContext(UserContext);

  const [isUserMenuOpened, setIsUserMenuOpened] = useState(false);

  return (
    <div
      className="app-region-no-drag flex flex-row items-center gap-6 justify-self-end"
    >
      {
        userAuth === undefined
          ? <></>
          : (
              <DropdownMenu open={isUserMenuOpened} onOpenChange={setIsUserMenuOpened}>
                <DropdownMenuTrigger asChild>
                  <TitleBarMenuButton
                    isActive={isUserMenuOpened}
                  >
                    <CircleUserIcon />
                  </TitleBarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuLabel>{userAuth.displayName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => window.open("https://patchkit.net", "_blank")}
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open("https://patchkit.net", "_blank")}
                  >
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOutUserMutation.mutateAsync()}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
      }
      <TitleBarMenuButton
        isActive={false}
        onClick={() => { toggleThemeVariantOption(); }}
      >
        <SunMoonIcon />
      </TitleBarMenuButton>
      <div className="flex flex-row">
        <TitleBarWindowButton
          variant="ghost"
          onClick={async () => {
            await minimizeWindow({});
          }}
        >
          <MinusIcon className="size-5" />
        </TitleBarWindowButton>
        <TitleBarWindowButton
          variant="destructive"
          onClick={async () => {
            await startQuitTask({});
          }}
        >
          <XIcon className="size-5" />
        </TitleBarWindowButton>
      </div>
    </div>
  );
}

export function TitleBar() {
  return (
    <div
      className="app-region-drag grid h-8 w-full grid-cols-3 border-b"
    >
      <TitleBarLeftPanel />
      <TitleBarCenterPanel />
      <TitleBarRightPanel />
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  userAuth?: UserAuth;
}>()({
  component: RouteComponent,
  notFoundComponent: RouteNotFoundComponent,
  errorComponent: RouteErrorComponent,
});

export function RouteComponent() {
  return (
    <div className="grid h-screen w-screen grid-rows-[auto_1fr]">
      <TitleBar />
      <div className="overflow-hidden">
        <Outlet />
      </div>
      <Toaster />
      <Suspense>
        <TanStackRouterDevtoolsOnlyInDev />
        <RuntimeApiQueryClientDevToolsOnlyInDev />
      </Suspense>
    </div>
  );
}

export function RouteNotFoundComponent() {
  return <Navigate to="/" />;
}

export function RouteErrorComponent(
  {
    error,
  }: {
    error: unknown;
  },
) {
  const navigate = useNavigate();

  return (
    <div className="flex h-lvh w-lvw items-center justify-center p-24">
      <Card className="bg-destructive">
        <CardHeader>
          <CardTitle className="text-center text-destructive-foreground">
            Whoops!
          </CardTitle>
          <CardDescription className="text-center text-destructive-foreground">
            Something went wrong. Please use the &quot;Restart&quot; button below to reload the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <TypographyInlineCode className="max-h-96 overflow-y-auto">
            {
              error instanceof Error
                ? (error.stack ?? String(error))
                : String(error)
            }
          </TypographyInlineCode>
        </CardContent>
        <CardFooter className="flex flex-col gap-6">
          <Button
            className="w-full"
            onClick={() => navigate({ to: "/" })}
          >
            Restart
          </Button>
          <Button
            variant="link"
            onClick={async () => {
              await startQuitTask({});
            }}
          >
            Quit
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
