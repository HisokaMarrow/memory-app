import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { HOVER } from "../../styles/web";
import { cta as cs } from "./CTASection.styles";

// ── CTA ───────────────────────────────────────────────────────────────────────
export default function CTASection() {
  return (
    <View style={cs.section}>
      <View style={cs.inner}>
        <View style={cs.badge}>
          <View style={cs.badgeDot} />
          <Text style={cs.badgeText}>Free to start — no card required</Text>
        </View>
        <Text style={cs.h2}>
          The sharpest minds{"\n"}
          <Text style={cs.h2Em}>train daily.</Text>
        </Text>
        <Text style={cs.subText}>Five minutes. Every day. Measurable results.</Text>
        <TouchableOpacity
          style={cs.btn}
          onPress={() => router.push("/login")}
          // @ts-ignore
          onMouseEnter={(e: any) => { e.currentTarget.style.transform = HOVER.ctaHoverTransform; e.currentTarget.style.boxShadow = HOVER.ctaHoverShadow; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = HOVER.ctaBaseShadow; }}
        >
          <Text style={cs.btnText}>Start Your Training</Text>
        </TouchableOpacity>
        <Text style={cs.note}>Joins 12,000+ daily learners · No credit card · Cancel anytime</Text>
      </View>
    </View>
  );
}
