import { useEffect, useState } from "react";
import ErrorLayout from "../components/ErrorLayout";

export default function Offline() {
  const [attempt, setAttempt] = useState(1);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (online) {
      window.location.reload();
      return;
    }

    const retryTimer = setTimeout(() => {
      setAttempt((prev) => prev + 1);
    }, 4000);

    return () => clearTimeout(retryTimer);
  }, [attempt, online]);

  return (
    <ErrorLayout
      code="OFFLINE"
      title="Connection to RoboCore Lost"
      description={`Unable to establish communication with the server. Retrying automatically… (Attempt ${attempt})`}
      primaryAction={{
        label: "Return to Base",
        href: "/",
      }}
    />
  );
}
