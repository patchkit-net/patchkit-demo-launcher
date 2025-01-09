import {
  createFileRoute,
  Navigate,
} from "@tanstack/react-router";

import { SpinnerLayout } from "@/components/spinner-layout";

export const Route = createFileRoute("/user-is-authenticated/library/app/")({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
});

export function RouteComponent() {
  return <Navigate to="/" />;
}
