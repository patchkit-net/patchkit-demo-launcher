import { createFileRoute } from "@tanstack/react-router";

import { SpinnerLayout } from "@/components/spinner-layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TypographyH1 } from "@/components/ui/typography-h1";
import { TypographyLead } from "@/components/ui/typography-lead";
import { TypographyMuted } from "@/components/ui/typography-muted";
import { TypographyP } from "@/components/ui/typography-p";

export const Route = createFileRoute("/user-is-authenticated/")({
  component: RouteComponent,
  pendingComponent: SpinnerLayout,
});

export function RouteComponent() {
  return (
    <div className="grid size-full animate-fade grid-rows-[auto_auto_1fr] animate-duration-500 animate-ease-in">
      <div
        className="flex flex-row items-center justify-start px-12 py-6"
      >
        <TypographyH1>Home</TypographyH1>
      </div>
      <Separator />
      <ScrollArea className="size-full">
        <div className="flex flex-col gap-1 p-12">
          <TypographyLead>Welcome!</TypographyLead>
          <TypographyP>This is PatchKit Demonstration Launcher made to showcase possibilities of our technology.</TypographyP>
          <TypographyP>
            You can access sources of this project
            {" "}
            <a href="https://patchkit.net">here</a>
            .
          </TypographyP>
          <TypographyP>
            Visit
            {" "}
            <a href="https://patchkit.net">PatchKit</a>
            {" "}
            to start distributing your games today!
          </TypographyP>
          <TypographyMuted>Upsoft 2024</TypographyMuted>
        </div>
      </ScrollArea>
    </div>
  );
}
