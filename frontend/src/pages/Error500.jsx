import { useState } from "react";
import ErrorLayout from "../components/ErrorLayout";

export default function Error500() {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <ErrorLayout
      code="500"
      title="System Failure Detected"
      description={
        retrying
          ? "Attempting automated recovery. Please stand by..."
          : "An internal malfunction occurred. The system was unable to complete your request."
      }
      primaryAction={{
        label: "Return to Base",
        href: "/",
      }}
      onRetry={handleRetry}
    />
  );
}
