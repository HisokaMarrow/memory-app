import AppFooter from "../layout/AppFooter";

export default function DashboardFooter({ hasBottomNav = false }: { hasBottomNav?: boolean }) {
  return <AppFooter hasBottomNav={hasBottomNav} />;
}
