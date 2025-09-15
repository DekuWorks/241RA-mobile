import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>241Runners Mobile</Text>
      <Text>Same backend & database as the static site.</Text>
      <Link href="/cases">View Cases</Link>
    </View>
  );
}
