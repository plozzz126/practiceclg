import { AlertCircle } from "lucide-react";

export function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-rose-600">
      <AlertCircle className="h-4 w-4" />
      {message}
    </p>
  );
}
