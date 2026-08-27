import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { FaqContent } from "@/components/legal/FaqContent";
import { APP_NAME } from "@/components/brand/TownExchangeLogo";

export default function FaqsPage() {
  return (
    <LegalPageLayout
      title="Frequently Asked Questions"
      subtitle={`Quick answers about accounts, listings, safety, and how ${APP_NAME} works.`}
    >
      <FaqContent />
    </LegalPageLayout>
  );
}
