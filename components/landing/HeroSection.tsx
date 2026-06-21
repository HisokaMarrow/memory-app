import { useState } from "react";
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { hero as hs2 } from "./HeroSection.styles";
import { buttonElevation } from "./webHover";

// ── Hero ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: require("../../assets/images/icon-goal.png"),     title: "Daily Practice",  sub: "Build the habit"   },
  { icon: require("../../assets/images/icon-progress.png"), title: "Track Progress",  sub: "See real results"  },
  { icon: require("../../assets/images/icon-brain.png"),    title: "Stronger Mind",   sub: "Sharpen focus"     },
];

export default function HeroSection({ onScrollTo }: { onScrollTo: (id: string) => void }) {
  const { width, height } = useWindowDimensions();
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const isMobile = width < 700;
  const isTiny = width < 380;
  const viewportHeight = height || (isMobile ? 680 : 820);
  const sectionHeight = Math.max(isMobile ? 560 : 620, viewportHeight - (isMobile ? 28 : 36));
  const heroSource = isMobile
    ? require("../../assets/images/hero-mobile.jpg")
    : require("../../assets/images/hero-desktop.jpg");

  return (
    <View style={[hs2.section, isMobile && hs2.sectionMobile, { height: sectionHeight }]}>
      <Image source={heroSource} style={[hs2.heroBgImage, isMobile && hs2.heroBgImageMobile]} resizeMode="cover" />
      <View style={[hs2.overlay, isMobile && hs2.overlayMobile]} />
      <View style={[hs2.content, isMobile && hs2.contentMobile]}>

        {/* Headline */}
        <Text style={[hs2.h1, isMobile && hs2.h1Mobile, isTiny && hs2.h1Tiny]}>
          Train your{"\n"}memory like{"\n"}
          <Text style={hs2.h1Em}>a skill.</Text>
        </Text>

        {/* Subtext */}
        <Text style={[hs2.subText, isMobile && hs2.subTextMobile]}>
          Remember numbers, names, anything.{"\n"}
          With daily practice, become unforgettable.
        </Text>

        {/* Buttons */}
        {!isMobile && (
          <View style={hs2.btnRow}>
            <TouchableOpacity
              style={[hs2.btnPrimary, buttonElevation(primaryHovered)]}
              onPress={() => router.push("/login")}
              // @ts-ignore web-only hover
              onMouseEnter={() => setPrimaryHovered(true)}
              onMouseLeave={() => setPrimaryHovered(false)}
            >
              <Text style={hs2.btnPrimaryText}>Start training</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={hs2.btnLink}
              onPress={() => onScrollTo("memory-test")}
              // @ts-ignore web-only hover
              onMouseEnter={() => setLinkHovered(true)}
              onMouseLeave={() => setLinkHovered(false)}
            >
              <Text style={[hs2.btnLinkText, linkHovered && hs2.btnLinkTextHover]}>Learn more →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feature strip */}
        {isMobile ? (
          <View style={hs2.mobileActionStrip}>
            <View style={hs2.btnRowMobile}>
              <TouchableOpacity
                style={[hs2.btnPrimary, hs2.btnPrimaryMobile, buttonElevation(primaryHovered)]}
                onPress={() => router.push("/login")}
                // @ts-ignore web-only hover
                onMouseEnter={() => setPrimaryHovered(true)}
                onMouseLeave={() => setPrimaryHovered(false)}
              >
                <Text style={hs2.btnPrimaryText}>Start training</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[hs2.btnLink, hs2.btnLinkMobile]}
                onPress={() => onScrollTo("memory-test")}
                // @ts-ignore web-only hover
                onMouseEnter={() => setLinkHovered(true)}
                onMouseLeave={() => setLinkHovered(false)}
              >
                <Text style={[hs2.btnLinkText, hs2.btnLinkTextMobile, linkHovered && hs2.btnLinkTextHover]}>Learn more →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={hs2.featureStrip}>
            {FEATURES.map((f, i) => (
              <View key={f.title} style={[hs2.featureItem, i === 0 && hs2.featureItemFirst]}>
                <Image source={f.icon} style={hs2.featureIconImg} resizeMode="cover" />
                <Text style={hs2.featureTitle}>{f.title}</Text>
                <Text style={hs2.featureSub}>{f.sub}</Text>
              </View>
            ))}
          </View>
        )}

      </View>
    </View>
  );
}
