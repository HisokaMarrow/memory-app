import type { ReactNode } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { game as s } from "../../styles/screens/game.styles";

/** Shared focused-game layer used for countdown, play, recall, and results. */
export default function GameFocusOverlay({
  children,
  mobile = false,
  onClose,
}: {
  children: ReactNode;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const closeButton = onClose ? (
    <View style={s.focusCloseRow}>
      <TouchableOpacity
        accessibilityLabel="Close game"
        accessibilityRole="button"
        activeOpacity={0.75}
        onPress={onClose}
        style={s.focusCloseButton}
      >
        <Feather name="x" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  ) : null;

  if (Platform.OS !== "web") {
    return (
      <Modal
        transparent
        visible
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={s.focusOverlayNative}>
          <View style={s.focusBlur} pointerEvents="none" />
          <SafeAreaView edges={["top", "bottom"]} style={s.focusSafeAreaNative}>
            <ScrollView
              style={s.focusScrollNative}
              contentContainerStyle={s.focusScrollContentNative}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[s.focusCardNative, mobile && s.focusCardNativeMobile]}>
                {closeButton}
                {children}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={[s.focusOverlay, mobile && s.focusOverlayMobile]}>
        <View style={s.focusBlur} pointerEvents="none" />
        <View style={[s.focusCard, mobile && s.focusCardMobile]}>
          {closeButton}
          {children}
        </View>
      </View>
    </Modal>
  );
}
