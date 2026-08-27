import { FaqContent } from "@/components/legal/FaqContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/components/brand/TownExchangeLogo";

export default function AccountFaqsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Quick answers about accounts, listings, and how {APP_NAME} works.
        </p>
      </CardHeader>
      <CardContent className="legal-prose">
        <FaqContent />
      </CardContent>
    </Card>
  );
}
