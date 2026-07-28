import FooterSection from "../layout/FooterSection";

export default function DashboardFooter({ hasBottomNav = false }: { hasBottomNav?: boolean }) {
  return <FooterSection dashboard hasBottomNav={hasBottomNav} />;
}
