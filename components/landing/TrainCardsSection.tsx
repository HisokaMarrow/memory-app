import { useState } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { train as trs } from "./TrainCardsSection.styles";

// ── Train Cards ───────────────────────────────────────────────────────────────
const CARDS = [
  { title: "Memory", icon: "🧠", desc: "Expand the limits of what your mind can hold and recall with precision.",  games: ["Number Sequence", "Face & Name", "Story Recall"],          badge: true  },
  { title: "Maths",  icon: "🔢", desc: "Build mental arithmetic speed and numerical intuition.",                   games: ["Mental Multiplication", "Number Bonds", "Speed Estimation"], badge: false },
  { title: "Words",  icon: "✍️", desc: "Strengthen vocabulary, verbal fluency and linguistic thinking.",           games: ["Word Builder", "Synonym Sprint", "Anagram Solver"],           badge: false },
  { title: "Logic",  icon: "🧩", desc: "Train systematic reasoning and pattern recognition.",                     games: ["Pattern Sequences", "Deduction Grids", "Lateral Puzzles"],    badge: false },
];

export default function TrainCardsSection() {
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState<string | null>(null);
  const isMobile = width < 700;
  const isTablet = width < 1020;

  return (
    <View nativeID="what-you-train" style={[trs.section, isMobile && trs.sectionMobile]}>
      <View style={trs.inner}>
        <View style={[trs.head, isMobile && trs.headMobile]}>
          <Text style={trs.eyebrow}>What You Train</Text>
          <Text style={[trs.h2, isMobile && trs.h2Mobile]}>Four pillars of{"\n"}a sharper mind</Text>
        </View>
        <View style={[trs.grid, isTablet && trs.gridTablet, isMobile && trs.gridMobile]}>
          {CARDS.map((card) => (
            <View
              key={card.title}
              style={[trs.card, isMobile && trs.cardMobile, !isMobile && hovered === card.title && trs.cardHover]}
              // @ts-ignore web-only hover
              onMouseEnter={() => setHovered(card.title)}
              onMouseLeave={() => setHovered(null)}
            >
              {card.badge && <View style={trs.cardBadge}><Text style={trs.cardBadgeText}>⭐ Popular</Text></View>}
              <View style={[trs.cardIcon, isMobile && trs.cardIconMobile]}><Text style={trs.cardIconText}>{card.icon}</Text></View>
              <Text style={trs.cardTitle}>{card.title}</Text>
              <Text style={trs.cardDesc}>{card.desc}</Text>
              <View style={trs.cardDivider}>
                <Text style={trs.cardExLabel}>Exercises</Text>
                {card.games.map((g) => (
                  <View key={g} style={trs.cardEx}>
                    <View style={trs.cardExDot} />
                    <Text style={trs.cardExText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
