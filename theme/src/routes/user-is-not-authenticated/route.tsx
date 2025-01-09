import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useContext } from "react";

import { SpinnerLayout } from "@/components/spinner-layout";
import { UserContext } from "@/contexts/user-context";

export const Route = createFileRoute("/user-is-not-authenticated")({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
  beforeLoad: (
    {
      context,
    },
  ) => {
    if (context.userAuth !== undefined) {
      throw redirect({ to: "/user-is-authenticated" });
    }

    return {};
  },
});

function RouteComponent() {
  const { userAuth } = useContext(UserContext);

  if (userAuth !== undefined) {
    return <Navigate to="/user-is-authenticated" />;
  }

  return <Outlet />;
}
