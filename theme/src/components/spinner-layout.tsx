import { Spinner } from "./ui/spinner";

export function SpinnerLayout() {
  return (
    <div className="flex size-full animate-fade items-center justify-center animate-duration-500 animate-ease-in">
      <Spinner />
    </div>
  );
}
