import { useState } from "react";
import { View, Text, TouchableOpacity, Image, Platform, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { s as hs } from "./NavBar.styles";

const links = [
  { label: "How It Works", id: "how-it-works"  },
  { label: "Train",        id: "what-you-train" },
  { label: "Memory Test",  id: "memory-test"    },
  { label: "Vault",        id: "vault"          },
];

export default function NavBar({
  scrolled,
  onNavClick,
}: {
  scrolled: boolean;
  onNavClick?: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState<string | null>(null);
  const [ctaHovered, setCtaHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isCompact = width < 860;
  const isMobile = width < 560;

  function handleNavClick(id: string) {
    setMenuOpen(false);
    if (onNavClick) {
      onNavClick(id);
    } else if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("scrollTo", id);
      router.push("/");
    }
  }

  function handleStartPress() {
    setMenuOpen(false);
    router.push("/login");
  }

  return (
    <View style={[hs.root, isCompact && hs.rootCompact, isMobile && hs.rootMobile, scrolled && hs.rootScrolled]}>
      <TouchableOpacity
        style={[hs.logo, isMobile && hs.logoMobileSurface]}
        onPress={() => handleNavClick("page-top")}
      >
        <Image source={require("../../assets/images/logo.png")} style={[hs.logoImg, isMobile && hs.logoImgMobile]} resizeMode="cover" />
        <Text style={[hs.logoName, isMobile && hs.logoNameMobile]}>MEMORO</Text>
      </TouchableOpacity>

      {!isCompact && <View style={hs.nav}>
        {links.map((l) => (
          <TouchableOpacity key={l.id} onPress={() => handleNavClick(l.id)}>
            <Text
              style={[hs.navLink, hovered === l.id && hs.navLinkActive]}
              // @ts-ignore web-only
              onMouseEnter={() => setHovered(l.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>}

      {!isCompact ? <View style={hs.btnRow}>
        <TouchableOpacity
          style={[hs.btnFilled, ctaHovered && hs.btnFilledHover]}
          onPress={handleStartPress}
          // @ts-ignore web-only hover
          onMouseEnter={() => setCtaHovered(true)}
          onMouseLeave={() => setCtaHovered(false)}
        >
          <Text style={hs.btnFilledText}>Get Started</Text>
        </TouchableOpacity>
      </View> : (
        <TouchableOpacity
          style={[hs.menuButton, menuOpen && hs.menuButtonActive]}
          onPress={() => setMenuOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <Feather name={menuOpen ? "x" : "menu"} size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {isCompact && menuOpen && (
        <View style={[hs.mobileMenu, isMobile && hs.mobileMenuPhone]}>
          {links.map((link) => (
            <TouchableOpacity key={link.id} style={hs.mobileMenuItem} onPress={() => handleNavClick(link.id)}>
              <Text style={hs.mobileMenuText}>{link.label}</Text>
              <Feather name="arrow-right" size={15} color="rgba(255,255,255,0.42)" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={hs.mobileMenuCta} onPress={handleStartPress}>
            <Text style={hs.mobileMenuCtaText}>Start training</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
