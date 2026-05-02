import { View, Text, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { hero as hs2 } from "./HeroSection.styles";

// ── Hero ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: require("../../assets/images/icon-goal.png"),     title: "Daily Practice",  sub: "Build the habit"   },
  { icon: require("../../assets/images/icon-progress.png"), title: "Track Progress",  sub: "See real results"  },
  { icon: require("../../assets/images/icon-brain.png"),    title: "Stronger Mind",   sub: "Sharpen focus"     },
];

export default function HeroSection({ onScrollTo }: { onScrollTo: (id: string) => void }) {
  return (
    <View style={hs2.section}>
      <Image source={require("../../assets/images/hero.png")} style={hs2.heroBgImage} resizeMode="cover" />
      <View style={hs2.overlay} />
      <View style={hs2.content}>

        {/* Headline */}
        <Text style={hs2.h1}>
          Train your{"\n"}memory like{"\n"}
          <Text style={hs2.h1Em}>a skill.</Text>
        </Text>

        {/* Subtext */}
        <Text style={hs2.subText}>
          Remember numbers, names, anything.{"\n"}
          With daily practice, become unforgettable.
        </Text>

        {/* Buttons */}
        <View style={hs2.btnRow}>
          <TouchableOpacity
            style={hs2.btnPrimary}
            onPress={() => router.push("/login")}
            // @ts-ignore
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(232,93,42,0.35)"; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <Text style={hs2.btnPrimaryText}>Start training</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={hs2.btnLink}
            onPress={() => onScrollTo("memory-test")}
            // @ts-ignore
            onMouseEnter={(e: any) => { e.currentTarget.style.color = "#121212"; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.color = ""; }}
          >
            <Text style={hs2.btnLinkText}>Learn more →</Text>
          </TouchableOpacity>
        </View>

        {/* Feature strip */}
        <View style={hs2.featureStrip}>
          {FEATURES.map((f, i) => (
            <View key={f.title} style={[hs2.featureItem, i === 0 && hs2.featureItemFirst]}>
              <Image source={f.icon} style={hs2.featureIconImg} resizeMode="cover" />
              <Text style={hs2.featureTitle}>{f.title}</Text>
              <Text style={hs2.featureSub}>{f.sub}</Text>
            </View>
          ))}
        </View>

      </View>
    </View>
  );
}
