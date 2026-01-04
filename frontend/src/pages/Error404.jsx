import ErrorLayout from "../components/ErrorLayout";

export default function Error404() {
  return (
    <ErrorLayout
      code="404"
      title="Oops! My sensors can’t find this page"
      description="The location you’re trying to access doesn’t exist or may have been moved. Let’s get you back on track."
      primaryAction={{
        label: "Return to Base",
        href: "/",
      }}
    />
  );
}
