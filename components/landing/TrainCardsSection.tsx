import { View, Text } from "react-native";
import { HOVER } from "../../styles/web";
import { train as trs } from "./TrainCardsSection.styles";

// ── Train Cards ───────────────────────────────────────────────────────────────
const CARDS = [
  { title: "Memory", icon: "🧠", desc: "Expand the limits of what your mind can hold and recall with precision.",  games: ["Number Sequence", "Face & Name", "Story Recall"],          badge: true  },
  { title: "Maths",  icon: "🔢", desc: "Build mental arithmetic speed and numerical intuition.",                   games: ["Mental Multiplication", "Number Bonds", "Speed Estimation"], badge: false },
  { title: "Words",  icon: "✍️", desc: "Strengthen vocabulary, verbal fluency and linguistic thinking.",           games: ["Word Builder", "Synonym Sprint", "Anagram Solver"],           badge: false },
  { title: "Logic",  icon: "🧩", desc: "Train systematic reasoning and pattern recognition.",                     games: ["Pattern Sequences", "Deduction Grids", "Lateral Puzzles"],    badge: false },
];

export default function TrainCardsSection() {
  return (
    <View nativeID="what-you-train" style={trs.section}>
      <View style={trs.inner}>
        <View style={trs.head}>
          <Text style={trs.eyebrow}>What You Train</Text>
          <Text style={trs.h2}>Four pillars of{"\n"}a sharper mind</Text>
        </View>
        <View style={trs.grid}>
          {CARDS.map((card) => (
            <View
              key={card.title}
              style={trs.card}
              // @ts-ignore
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = HOVER.cardHoverTransform; e.currentTarget.style.boxShadow = HOVER.cardHoverShadow; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              {card.badge && <View style={trs.cardBadge}><Text style={trs.cardBadgeText}>⭐ Popular</Text></View>}
              <View style={trs.cardIcon}><Text style={trs.cardIconText}>{card.icon}</Text></View>
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
