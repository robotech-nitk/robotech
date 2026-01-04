import ErrorLayout from "../components/ErrorLayout";

export default function Error403() {
  return (
    <ErrorLayout
      code="403"
      title="Restricted Sector"
      description="Your access credentials do not permit entry into this module. Authorization is required to proceed."
      primaryAction={{
        label: "Return to Base",
        href: "/",
      }}
    />
  );
}
