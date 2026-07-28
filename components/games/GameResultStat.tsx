import { Text, View } from "react-native";

import { game as s } from "../../styles/screens/game.styles";

type GameResultStatProps = {
  label: string;
  value: string;
  color?: string;
  light?: boolean;
  compact?: boolean;
};

export default function GameResultStat({
  label,
  value,
  color,
  light = true,
  compact = false,
}: GameResultStatProps) {
  return (
    <View style={[s.statTile, light && s.statTileLight, compact && s.statTileMobile]}>
      <Text style={[s.statValue, light && s.statValueLight, compact && s.statValueMobile, color ? { color } : null]}>
        {value}
      </Text>
      <Text style={[s.statLabel, light && s.statLabelLight, compact && s.statLabelMobile]}>
        {label}
      </Text>
    </View>
  );
}
