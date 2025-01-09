import { Button } from "./ui/button";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { TypographyMuted } from "./ui/typography-muted";

export function AreYouSureDialogContent(
  {
    title,
    message,
    onConfirm,
  }: {
    title: string;
    message: string;
    onConfirm: () => void;
  },
) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {title}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-6">
        <TypographyMuted>{message}</TypographyMuted>
        <div className="flex flex-row justify-end gap-2">
          <DialogClose asChild>
            <Button
              className="w-24"
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              className="w-24"
              variant="destructive"
            >
              Cancel
            </Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  );
}
