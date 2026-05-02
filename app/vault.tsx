import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import DashboardShell from "../components/dashboard/DashboardShell";
import { GAME_CATEGORIES, gamesByCategory, getCategoryConfig, type GameCategoryConfig, type GameConfig } from "../data/gamesCatalog";
import { dashboard as s } from "../styles/screens/dashboard.styles";

function SkillNode({
  game,
  index,
  total,
}: {
  game: GameConfig;
  index: number;
  total: number;
}) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const x = `${18 + col * 32 + (row % 2 ? 11 : 0)}%`;
  const y = `${14 + row * 26}%`;
  const unlocked = game.unlocked;

  return (
    <View style={[s.skillNodeWrap, { left: x as any, top: y as any }]}>
      {index < total - 1 && <View style={[s.skillConnector, { backgroundColor: `${game.color}44` }]} />}
      <TouchableOpacity
        disabled={!unlocked}
        style={[s.skillNode, { borderColor: `${game.color}55` }, unlocked && { backgroundColor: game.color }]}
        onPress={() => router.push(`/game/${game.id}` as any)}
      >
        <MaterialCommunityIcons name={game.icon} size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={s.skillNodeLabel}>
        <Text style={s.skillNodeTitle}>{game.title}</Text>
        <Text style={s.skillNodeSub}>{game.difficulty}</Text>
      </View>
    </View>
  );
}

function EmptyTree({ category }: { category: GameCategoryConfig }) {
  return (
    <View style={s.vaultEmpty}>
      <View style={[s.vaultEmptyIcon, { backgroundColor: `${category.color}18` }]}>
        <Text style={s.vaultEmptyEmoji}>{category.emoji}</Text>
      </View>
      <Text style={s.vaultEmptyTitle}>{category.title} tree coming soon</Text>
      <Text style={s.vaultEmptyText}>New nodes will appear here when games are added to this training category.</Text>
    </View>
  );
}

export default function VaultScreen() {
  const groups = useMemo(() => gamesByCategory(), []);
  const categories = useMemo(() => {
    const withGames = groups.map((group) => group.category);
    const missing = GAME_CATEGORIES.filter((category) => !withGames.some((item) => item.id === category.id));
    return [...withGames, ...missing];
  }, [groups]);
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "Memory");
  const activeCategory = getCategoryConfig(activeCategoryId);
  const activeGames = groups.find((group) => group.category.id === activeCategoryId)?.games ?? [];

  return (
    <DashboardShell
      active="vault"
      title="Vault"
      subtitle="Skill trees for techniques, drills, and unlockable training paths."
      beige
    >
      <View style={s.vaultPage}>
        <View style={s.vaultTabs}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[s.vaultTab, activeCategoryId === category.id && { backgroundColor: category.color, borderColor: category.color }]}
              onPress={() => setActiveCategoryId(category.id)}
            >
              <Text style={s.vaultTabEmoji}>{category.emoji}</Text>
              <Text style={[s.vaultTabText, activeCategoryId === category.id && s.vaultTabTextActive]}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.vaultHero}>
          <View>
            <Text style={s.sectionLabel}>Skill Tree</Text>
            <Text style={s.vaultTitle}>{activeCategory.title}</Text>
            <Text style={s.vaultIntro}>{activeCategory.description}</Text>
          </View>
          <View style={[s.vaultHeroIcon, { backgroundColor: activeCategory.color }]}>
            <Text style={s.vaultHeroEmoji}>{activeCategory.emoji}</Text>
          </View>
        </View>

        <View style={s.skillTreeCard}>
          <View style={s.skillTreeGrid} pointerEvents="none" />
          {activeGames.length > 0 ? (
            activeGames.map((game, index) => (
              <SkillNode key={game.id} game={game} index={index} total={activeGames.length} />
            ))
          ) : (
            <EmptyTree category={activeCategory} />
          )}
        </View>

        <View style={s.vaultLegend}>
          <View style={s.vaultLegendItem}>
            <View style={[s.vaultLegendDot, { backgroundColor: activeCategory.color }]} />
            <Text style={s.vaultLegendText}>Unlocked game node</Text>
          </View>
          <View style={s.vaultLegendItem}>
            <Feather name="mouse-pointer" size={13} color="#6B6057" />
            <Text style={s.vaultLegendText}>Select a node to start training</Text>
          </View>
        </View>
      </View>
    </DashboardShell>
  );
}

