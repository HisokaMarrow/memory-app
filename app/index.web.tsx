// ─────────────────────────────────────────────────────────────────────────────
// Memoro — Landing Page
// Landing-only sections live in components/landing.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView } from "react-native";

import { layout } from "../styles/layout";

import FooterSection           from "../components/layout/FooterSection";
import NavBar                  from "../components/layout/NavBar";
import CTASection              from "../components/landing/CTASection";
import DashboardPreviewSection from "../components/landing/DashboardPreviewSection";
import HeroSection             from "../components/landing/HeroSection";
import HowItWorksSection       from "../components/landing/HowItWorksSection";
import MemoryTestSection       from "../components/landing/MemoryTestSection";
import TrainCardsSection       from "../components/landing/TrainCardsSection";
import VaultSection            from "../components/landing/VaultSection";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({ "page-top": 0 });

  const registerSection = useCallback((id: string) => (e: any) => {
    sectionOffsets.current[id] = e.nativeEvent.layout.y;
  }, []);

  const scrollToTop = useCallback(() => {
    if (!scrollRef.current) return false;
    scrollRef.current.scrollTo({ y: 0, animated: true });
    return true;
  }, []);

  const scrollToSection = useCallback((id: string) => {
    if (id === "page-top") {
      return scrollToTop();
    }

    const y = sectionOffsets.current[id];
    if (y === undefined || !scrollRef.current) return false;

    scrollRef.current.scrollTo({ y, animated: true });
    return true;
  }, [scrollToTop]);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const target = sessionStorage.getItem("scrollTo");
    if (!target) return;
    sessionStorage.removeItem("scrollTo");
    let attempts = 0;
    const tryScroll = () => {
      const didScroll = scrollToSection(target);
      if (!didScroll && attempts < 30) {
        attempts++;
        setTimeout(tryScroll, 100);
      }
    };
    setTimeout(tryScroll, 100);
  }, [scrollToSection, scrollToTop]);

  return (
    <View style={layout.root}>
      <NavBar scrolled={scrolled} onNavClick={scrollToSection} />
      <ScrollView
        ref={scrollRef}
        style={layout.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 60)}
      >
        <View onLayout={registerSection("page-top")}>
          <HeroSection onScrollTo={scrollToSection} />
        </View>
        <View onLayout={registerSection("memory-test")}>
          <MemoryTestSection />
        </View>
        <View onLayout={registerSection("what-you-train")}>
          <TrainCardsSection />
        </View>
        <View onLayout={registerSection("how-it-works")}>
          <HowItWorksSection />
        </View>
        <DashboardPreviewSection />
        <View onLayout={registerSection("vault")}>
          <VaultSection />
        </View>
        <CTASection />
        <FooterSection />
      </ScrollView>
    </View>
  );
}
