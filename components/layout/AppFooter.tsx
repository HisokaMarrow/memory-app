import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Linking, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { appFoot as fs } from "./AppFooter.styles";

const SOCIAL_LINKS = [
  { icon: "mail", href: "mailto:hello@memoro.app", label: "Email Memoro" },
  { icon: "instagram", href: "https://www.instagram.com/", label: "Memoro on Instagram" },
  { icon: "linkedin", href: "https://www.linkedin.com/", label: "Memoro on LinkedIn" },
  { icon: "twitter", href: "https://x.com/", label: "Memoro on X" },
] as const;

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/games", label: "Games" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "mailto:hello@memoro.app", label: "Contact" },
  { href: "/", label: "Terms" },
] as const;

function openHref(href: string) {
  if (href.startsWith("http") || href.startsWith("mailto:")) {
    Linking.openURL(href);
    return;
  }
  router.push(href as any);
}

// Staggered fade-up, one step per row (logo, nav, socials, copyright).
function useStagger(count: number) {
  const values = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      values.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [values]);

  return values.map((value) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  }));
}

export default function AppFooter({ hasBottomNav = false }: { hasBottomNav?: boolean }) {
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState<string | null>(null);
  const isMobile = width < 700;
  const [logoAnim, navAnim, socialAnim, copyrightAnim] = useStagger(4);

  return (
    <View style={[fs.section, isMobile && fs.sectionMobile, hasBottomNav && fs.sectionWithBottomNav]}>
      <View style={[fs.card, isMobile && fs.cardMobile]}>
        <View style={[fs.stack, isMobile && fs.stackMobile]}>
          <Animated.View style={logoAnim}>
            <TouchableOpacity
              style={fs.logoWrap}
              onPress={() => openHref("/")}
              accessibilityRole="link"
              accessibilityLabel="Memoro"
            >
              <Image source={require("../../assets/images/logo.png")} style={fs.logoImg} resizeMode="cover" />
              <Text style={fs.logoName}>MEMORO</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[fs.nav, navAnim]}>
            {NAV_LINKS.map((link) => {
              const isHovered = hovered === link.label;
              return (
                <TouchableOpacity
                  key={link.label}
                  style={[fs.navLink, isHovered && fs.navLinkHover]}
                  onPress={() => openHref(link.href)}
                  accessibilityRole="link"
                  accessibilityLabel={link.label}
                  // @ts-ignore web-only hover
                  onMouseEnter={() => setHovered(link.label)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <Text style={[fs.navLinkText, isHovered && fs.navLinkTextHover]}>{link.label}</Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <Animated.View style={[fs.socialRow, socialAnim]}>
            {SOCIAL_LINKS.map((link) => {
              const isHovered = hovered === link.label;
              return (
                <TouchableOpacity
                  key={link.label}
                  style={[fs.socialButton, isHovered && fs.socialButtonHover]}
                  onPress={() => openHref(link.href)}
                  accessibilityRole="link"
                  accessibilityLabel={link.label}
                  // @ts-ignore web-only hover
                  onMouseEnter={() => setHovered(link.label)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <Feather name={link.icon as any} size={17} color="#FFFFFF" />
                </TouchableOpacity>
              );
            })}
          </Animated.View>
          </View>

        <View style={fs.divider} />

        <Animated.View style={[fs.copyright, copyrightAnim]}>
          <Text style={fs.copyrightText}>© {new Date().getFullYear()} Memoro. All rights reserved.</Text>
        </Animated.View>
      </View>
    </View>
  );
}
