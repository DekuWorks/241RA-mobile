import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

const qc = new QueryClient();
SplashScreen.preventAutoHideAsync();

export default function Root() {
  useEffect(() => { setTimeout(() => SplashScreen.hideAsync(), 300); }, []);
  return (
    <QueryClientProvider client={qc}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
