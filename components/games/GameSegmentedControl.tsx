import { Text, TouchableOpacity, View } from "react-native";

import { game as s } from "../../styles/screens/game.styles";

type GameSegmentedControlProps<T extends string | number> = {
  accentColor: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  labelForOption?: (value: T) => string;
};

/** Shared setting selector whose active state inherits the current game's colour. */
export default function GameSegmentedControl<T extends string | number>({
  accentColor,
  options,
  value,
  onChange,
  compact = false,
  labelForOption,
}: GameSegmentedControlProps<T>) {
  return (
    <View style={[s.segmented, compact && s.segmentedMobile]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={String(option)}
            style={[
              s.segment,
              compact && s.segmentMobile,
              active && s.segmentActive,
              active && { backgroundColor: accentColor, borderColor: accentColor, boxShadow: `0 6px 14px ${accentColor}2E` as any },
            ]}
            onPress={() => onChange(option)}
          >
            <Text style={[s.segmentText, compact && s.segmentTextMobile, active && s.segmentTextActive]}>
              {labelForOption ? labelForOption(option) : String(option)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
