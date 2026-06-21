import { useState } from "react";
import { Image, Linking, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { foot as fs } from "./FooterSection.styles";

const SOCIAL_LINKS = [
  { icon: "mail", href: "mailto:hello@memoro.app", label: "Email Memoro" },
  { icon: "instagram", href: "https://www.instagram.com/", label: "Memoro on Instagram" },
  { icon: "linkedin", href: "https://www.linkedin.com/", label: "Memoro on LinkedIn" },
  { icon: "twitter", href: "https://x.com/", label: "Memoro on X" },
] as const;

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/games", label: "Games" },
  { href: "/vault", label: "Vault" },
] as const;

const LEGAL_LINKS = [
  { href: "mailto:hello@memoro.app", label: "Contact" },
  { href: "/", label: "Privacy" },
  { href: "/", label: "Terms" },
] as const;

type FooterSectionProps = {
  dashboard?: boolean;
  hasBottomNav?: boolean;
};

function openHref(href: string) {
  if (href.startsWith("http") || href.startsWith("mailto:")) {
    Linking.openURL(href);
    return;
  }

  router.push(href as any);
}

export default function FooterSection({ dashboard = false, hasBottomNav = false }: FooterSectionProps) {
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState<string | null>(null);
  const isMobile = width < 700;

  return (
    <View style={[fs.section, dashboard && fs.sectionDashboard, isMobile && fs.sectionMobile, hasBottomNav && fs.sectionWithBottomNav]}>
      <View style={fs.inner}>
        <View style={[fs.topRow, isMobile && fs.topRowMobile]}>
          <TouchableOpacity
            style={fs.logoWrap}
            onPress={() => openHref("/")}
            accessibilityRole="link"
            accessibilityLabel="Memoro"
          >
            <Image
              source={require("../../assets/images/logo.png")}
              style={[fs.logoImg, isMobile && fs.logoImgMobile]}
              resizeMode="cover"
            />
            <Text style={fs.logoName}>MEMORO</Text>
          </TouchableOpacity>

          <View style={[fs.socialRow, isMobile && fs.socialRowMobile]}>
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
          </View>
        </View>

        <View style={fs.divider} />

        <View style={[fs.bottomGrid, isMobile && fs.bottomGridMobile]}>
          <View style={fs.copyrightBlock}>
            <Text style={fs.copyrightText}>© 2026 Memoro. All rights reserved.</Text>
            <Text style={fs.licenseText}>Built for focused memory training.</Text>
          </View>

          <View style={[fs.linkArea, isMobile && fs.linkAreaMobile]}>
            <View style={[fs.mainLinks, isMobile && fs.mainLinksMobile]}>
              {MAIN_LINKS.map((link) => {
                const key = `main-${link.label}`;
                const isHovered = hovered === key;
                return (
                  <TouchableOpacity
                    key={link.label}
                    style={fs.linkButton}
                    onPress={() => openHref(link.href)}
                    accessibilityRole="link"
                    accessibilityLabel={link.label}
                    // @ts-ignore web-only hover
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <Text style={[fs.mainLinkText, isHovered && fs.mainLinkTextHover]}>{link.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[fs.legalLinks, isMobile && fs.legalLinksMobile]}>
              {LEGAL_LINKS.map((link) => {
                const key = `legal-${link.label}`;
                const isHovered = hovered === key;
                return (
                  <TouchableOpacity
                    key={link.label}
                    style={fs.linkButton}
                    onPress={() => openHref(link.href)}
                    accessibilityRole="link"
                    accessibilityLabel={link.label}
                    // @ts-ignore web-only hover
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <Text style={[fs.legalLinkText, isHovered && fs.legalLinkTextHover]}>{link.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
