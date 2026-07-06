import type { ReactNode } from "react";
import { Modal, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { game as s } from "../../styles/screens/game.styles";

/** Shared focused-game layer used for countdown, play, recall, and results. */
export default function GameFocusOverlay({ children, mobile = false }: { children: ReactNode; mobile?: boolean }) {
  if (Platform.OS !== "web") {
    return (
      <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <View style={s.focusOverlayNative}>
          <View style={s.focusBlur} pointerEvents="none" />
          <SafeAreaView edges={["top", "bottom"]} style={s.focusSafeAreaNative}>
            <ScrollView style={s.focusScrollNative} contentContainerStyle={s.focusScrollContentNative} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={[s.focusCardNative, mobile && s.focusCardNativeMobile]}>{children}</View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => {}}>
      <View style={[s.focusOverlay, mobile && s.focusOverlayMobile]}>
        <View style={s.focusBlur} pointerEvents="none" />
        <View style={[s.focusCard, mobile && s.focusCardMobile]}>{children}</View>
      </View>
    </Modal>
  );
}
