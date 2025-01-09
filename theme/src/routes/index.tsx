import {
  createFileRoute,
  Navigate,
  redirect,
} from "@tanstack/react-router";
import { useContext } from "react";

import { UserContext } from "@/contexts/user-context";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  beforeLoad: (
    {
      context,
    },
  ) => {
    if (context.userAuth === undefined) {
      throw redirect({ to: "/user-is-not-authenticated" });
    } else {
      throw redirect({ to: "/user-is-authenticated" });
    }
  },
});

function RouteComponent() {
  const { userAuth } = useContext(UserContext);

  if (userAuth === undefined) {
    return <Navigate to="/user-is-not-authenticated" />;
  } else {
    return <Navigate to="/user-is-authenticated" />;
  }
}
