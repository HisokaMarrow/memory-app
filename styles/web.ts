import { StyleSheet } from "react-native";

export function createWebStyles(styles: Record<string, unknown>): any {
  return StyleSheet.create(styles as any) as any;
}
