import { useState } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { vault as vs } from "./VaultSection.styles";

// ── Vault ─────────────────────────────────────────────────────────────────────
const TECHNIQUES = [
  { cat: "Memory",   title: "The Chunking Method",   desc: "Group information into meaningful clusters. Your working memory handles 7±2 items — chunking lets you hold more by treating groups as single units.", example: '"48 · 372 · 91" instead of "4 · 8 · 3 · 7 · 2 · 9 · 1"' },
  { cat: "Memory",   title: "Memory Palace",          desc: "Place information along a familiar mental route. Spatial memory is among the strongest — we can recall vivid locations for decades.",               example: "Walk through your home, placing each item to remember in each room."         },
  { cat: "Maths",    title: "Multiplication Bridges", desc: "Break hard multiplications into easier ones. 19×6 becomes (20×6)−6 = 114. Much faster mentally.",                                                   example: "47×8 → (50×8)−(3×8) = 400−24 = 376"                                        },
  { cat: "Language", title: "Etymology Mapping",      desc: "Learning root words unlocks clusters of vocabulary at once. One Latin root can decode 20+ English words instantly.",                                 example: '"port" (carry) → import, export, transport, portable, porter…'              },
];

export default function VaultSection() {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const t = TECHNIQUES[active];
  const isMobile = width < 760;
  return (
    <View nativeID="vault" style={[vs.section, isMobile && vs.sectionMobile]}>
      <View style={[vs.inner, isMobile && vs.innerMobile]}>
        <View>
          <Text style={vs.eyebrow}>The Vault</Text>
          <Text style={[vs.h2, isMobile && vs.h2Mobile]}>Real techniques,{"\n"}not tricks</Text>
          <Text style={[vs.subText, isMobile && vs.subTextMobile]}>
            Every session teaches a proven cognitive method used by memory champions, chess grandmasters, and elite students.
          </Text>
          <View style={vs.tabList}>
            {TECHNIQUES.map((tech, i) => (
              <TouchableOpacity key={i} style={[vs.tab, isMobile && vs.tabMobile, active === i ? vs.tabActive : vs.tabInactive]} onPress={() => setActive(i)}>
                <View style={[vs.tabDot, active === i ? vs.tabDotActive : vs.tabDotInactive]} />
                <View>
                  <Text style={[vs.tabCat,   active === i ? vs.tabCatActive   : vs.tabCatInactive]}>{tech.cat}</Text>
                  <Text style={[vs.tabTitle, active === i ? vs.tabTitleActive : vs.tabTitleInactive]}>{tech.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[vs.detailCard, isMobile && vs.detailCardMobile, (vs as any)[`detailCardBg${active}`]]}>
          <Text style={vs.detailCat}>{t.cat}</Text>
          <Text style={[vs.detailTitle, isMobile && vs.detailTitleMobile]}>{t.title}</Text>
          <Text style={vs.detailDesc}>{t.desc}</Text>
          <View style={vs.exampleBox}>
            <Text style={vs.exampleLabel}>Example</Text>
            <Text style={vs.exampleText}>{t.example}</Text>
          </View>
          <View style={vs.detailFooter}>
            <View style={vs.detailFooterIcon}><Text style={vs.checkIconText}>✓</Text></View>
            <Text style={vs.detailFooterText}>Part of your daily training session</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
