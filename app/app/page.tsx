import type { Metadata } from "next";
import CopilotApp from "@/components/copilot-app";

export const metadata: Metadata = {
  title: "Miwa | App",
  description:
    "Miwa is a therapist-facing AI clinical copilot for documentation, reflection, and supervision support.",
};

export default function AppPage() {
  return <CopilotApp />;
}
