import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { isOnboarded, isLoading } = useApp();

  if (isLoading) return null;

  if (!isOnboarded) return <Redirect href="/onboarding" />;

  return <Redirect href="/(tabs)/map" />;
}
