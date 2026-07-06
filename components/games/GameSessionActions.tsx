import type { ComponentProps } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { game as s } from "../../styles/screens/game.styles";

type FeatherName = ComponentProps<typeof Feather>["name"];

type GameSessionActionsProps = {
  accentColor: string;
  mobile?: boolean;
  primaryDisabled?: boolean;
  primaryIcon?: FeatherName;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryDisabled?: boolean;
  secondaryIcon?: FeatherName;
  secondaryLabel?: string;
  onSecondary: () => void;
  tertiaryDestructive?: boolean;
  tertiaryDisabled?: boolean;
  tertiaryIcon?: FeatherName;
  tertiaryLabel?: string;
  onTertiary?: () => void;
};

/** Shared action footer used by every gameplay and result container. */
export default function GameSessionActions({
  accentColor,
  mobile = false,
  primaryDisabled = false,
  primaryIcon = "arrow-right",
  primaryLabel,
  onPrimary,
  secondaryDisabled = false,
  secondaryIcon = "arrow-left",
  secondaryLabel = "Back",
  onSecondary,
  tertiaryDestructive = false,
  tertiaryDisabled = false,
  tertiaryIcon = "x",
  tertiaryLabel,
  onTertiary,
}: GameSessionActionsProps) {
  return (
    <View
      style={[s.controlRow, s.sessionActionRow, mobile && s.controlRowMobile]}
    >
      <TouchableOpacity
        disabled={secondaryDisabled}
        style={[
          s.secondaryButton,
          s.sessionActionButton,
          mobile && s.secondaryButtonMobile,
          secondaryDisabled && s.buttonDisabled,
        ]}
        onPress={() => onSecondary()}
      >
        <Feather name={secondaryIcon} size={14} color="#FFFFFF" />
        <Text style={s.secondaryButtonText}>{secondaryLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        disabled={primaryDisabled}
        style={[
          s.primaryButtonInline,
          s.sessionActionButton,
          {
            backgroundColor: accentColor,
            boxShadow: `0 10px 24px ${accentColor}38` as any,
          },
          mobile && s.primaryButtonInlineMobile,
          primaryDisabled && s.buttonDisabled,
        ]}
        onPress={() => onPrimary()}
      >
        <Feather name={primaryIcon} size={15} color="#FFFFFF" />
        <Text style={s.primaryButtonText}>{primaryLabel}</Text>
      </TouchableOpacity>
      {tertiaryLabel && onTertiary ? (
        <TouchableOpacity
          disabled={tertiaryDisabled}
          style={[
            s.secondaryButton,
            s.sessionActionButton,
            tertiaryDestructive && {
              backgroundColor: "#D64B45",
              borderColor: "#D64B45",
            },
            mobile && s.secondaryButtonMobile,
            tertiaryDisabled && s.buttonDisabled,
          ]}
          onPress={() => onTertiary()}
        >
          <Feather name={tertiaryIcon} size={14} color="#FFFFFF" />
          <Text style={s.secondaryButtonText}>{tertiaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
