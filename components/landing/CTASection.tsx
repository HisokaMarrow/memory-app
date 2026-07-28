import { useState } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { cta as cs } from "./CTASection.styles";

// ── CTA ───────────────────────────────────────────────────────────────────────
export default function CTASection() {
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState(false);
  const isMobile = width < 700;

  return (
    <View style={[cs.section, isMobile && cs.sectionMobile]}>
      <View style={cs.inner}>
        <View style={[cs.badge, isMobile && cs.badgeMobile]}>
          <View style={cs.badgeDot} />
          <Text style={cs.badgeText}>Free to start — no card required</Text>
        </View>
        <Text style={[cs.h2, isMobile && cs.h2Mobile]}>
          The sharpest minds{"\n"}
          <Text style={cs.h2Em}>train daily.</Text>
        </Text>
        <Text style={[cs.subText, isMobile && cs.subTextMobile]}>Five minutes. Every day. Measurable results.</Text>
        <TouchableOpacity
          style={[cs.btn, isMobile && cs.btnMobile, !isMobile && hovered && cs.btnHover]}
          onPress={() => router.push("/login")}
          // @ts-ignore web-only hover
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Text style={cs.btnText}>Start Your Training</Text>
        </TouchableOpacity>
        <Text style={[cs.note, isMobile && cs.noteMobile]}>Joins 12,000+ daily learners · No credit card · Cancel anytime</Text>
      </View>
    </View>
  );
}
