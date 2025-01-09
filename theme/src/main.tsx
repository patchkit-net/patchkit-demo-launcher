import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReactThemeExtrasContextProvider } from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";
import {
  StrictMode,
  useContext,
  useMemo,
} from "react";
import { createRoot } from "react-dom/client";

import { UserContextProvider as CustomUserContextProvider } from "./contexts/custom-user-context";
import { UserContextProvider as FirebaseUserContextProvider } from "./contexts/firebase-user-context";
import { ParticlesComponentContextProvider } from "./contexts/particles-component-context";
import { ThemeVariantContextProvider } from "./contexts/theme-variant-context";
import {
  UserContext,
  UserContextProvider,
} from "./contexts/user-context";
import { routeTree } from "./route-tree";

import "./index.css";
import "unfonts.css";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function RouterWithContextProvider() {
  const { userAuth } = useContext(UserContext);

  const context = useMemo(() => ({ userAuth }), [userAuth]);

  return <RouterProvider router={router} context={context} />;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactThemeExtrasContextProvider>
        <CustomUserContextProvider>
          <FirebaseUserContextProvider>
            <UserContextProvider>
              <ThemeVariantContextProvider>
                <ParticlesComponentContextProvider>
                  <RouterWithContextProvider />
                </ParticlesComponentContextProvider>
              </ThemeVariantContextProvider>
            </UserContextProvider>
          </FirebaseUserContextProvider>
        </CustomUserContextProvider>
      </ReactThemeExtrasContextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
