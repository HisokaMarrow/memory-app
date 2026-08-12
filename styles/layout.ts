import { StyleSheet } from "react-native";
import { P } from "./tokens";

export const layout = StyleSheet.create({
  root:   { flex: 1, backgroundColor: P.dark },
  scroll: { flex: 1, overscrollBehavior: "none" } as any,
});
