"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <ErrorState
        title="Something went wrong"
        message="Try again. JSON stays in this browser and was not sent anywhere."
        action={
          <Button size="sm" variant="secondary" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
