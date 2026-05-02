import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import DashboardShell from "../../components/dashboard/DashboardShell";
import GameExperienceShell from "../../components/games/GameExperienceShell";
import NumbersGame from "../../components/games/numbers/NumbersGame";
import { GAMES } from "../../data/gamesCatalog";
import { game as s } from "../../styles/screens/game.styles";

export default function GameRoute() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = GAMES.find((item) => item.id === gameId);

  return (
    <DashboardShell
      active="games"
      title={game?.title ?? "Game"}
      subtitle={game ? "Set your exercise, memorise the sequence, then recall it in order." : "This game is not available yet."}
      previewEnabled
    >
      {game ? (
        <GameExperienceShell game={game} eyebrow="Focused training" phase="Setup · Play · Results" toneColor={game.color}>
          {game.id === "numbers-game" ? (
            <NumbersGame game={game} />
          ) : (
            <View style={s.panel}>
              <View style={s.panelHeader}>
                <View>
                  <Text style={s.kicker}>Coming soon</Text>
                  <Text style={s.panelTitle}>{game.title}</Text>
                </View>
              </View>
              <Text style={s.emptyText}>This game will use the same focused training structure after the Numbers Game is complete.</Text>
              <TouchableOpacity style={s.primaryButtonInline} onPress={() => router.push("/games" as any)}>
                <Feather name="arrow-left" size={15} color="#FFFFFF" />
                <Text style={s.primaryButtonText}>Back to Games</Text>
              </TouchableOpacity>
            </View>
          )}
        </GameExperienceShell>
      ) : (
        <View style={s.page}>
          <View style={s.panel}>
            <Text style={s.panelTitle}>Game not found</Text>
            <Text style={s.emptyText}>Choose a game from the catalogue to start a training session.</Text>
            <TouchableOpacity style={s.primaryButtonInline} onPress={() => router.push("/games" as any)}>
              <Feather name="arrow-left" size={15} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </DashboardShell>
  );
}

