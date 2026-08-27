import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalList, LegalNote, LegalSection } from "@/components/legal/LegalProse";
import { APP_NAME, APP_LOCATION } from "@/components/brand/TownExchangeLogo";

const LAST_UPDATED = "August 5, 2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle={`This Privacy Policy explains how Stack Rack collects, uses, and protects your information when you use ${APP_NAME}.`}
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection title="1. Who we are">
        <p>
          {APP_NAME} is operated by Stack Rack (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;). We are the data controller for personal information processed through
          the Platform, except where a property owner independently contacts you outside the
          Platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>
          <strong>Account information:</strong> name, email address, password (stored in hashed
          form), role (buyer, owner, admin), and profile details you choose to provide.
        </p>
        <p>
          <strong>Listing and content data:</strong> property descriptions, photos, locations,
          pricing, stories, favourites, and messages or notes you submit on the Platform.
        </p>
        <p>
          <strong>Usage data:</strong> pages viewed, searches, filters applied, device type,
          browser, IP address, approximate location, and interaction timestamps.
        </p>
        <p>
          <strong>Communications:</strong> support requests, feedback, and correspondence with our
          team.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <LegalList
          items={[
            "Create and manage your account and authenticate your sessions.",
            "Display listings, stories, favourites, and personalized search results.",
            "Enable owners and seekers to connect regarding properties.",
            "Improve Platform performance, security, and user experience.",
            "Send service-related notices (e.g. account verification, security alerts).",
            "Respond to support requests and enforce our Terms & Conditions.",
            "Comply with legal obligations and protect against fraud or abuse.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Legal basis (where applicable)">
        <p>
          Depending on context, we process personal data based on your consent, performance of a
          contract (providing the Platform), legitimate interests (security and product
          improvement), or legal obligation.
        </p>
      </LegalSection>

      <LegalSection title="5. Sharing of information">
        <LegalNote>
          We do not sell your personal information to third-party advertisers.
        </LegalNote>
        <p>We may share information with:</p>
        <LegalList
          items={[
            "Other users — when you post a listing or when contact details are intentionally revealed through Platform features.",
            "Service providers — hosting, analytics, email delivery, and customer support tools bound by confidentiality obligations.",
            "Legal authorities — when required by law, court order, or to protect rights and safety.",
            "Business transfers — in connection with a merger, acquisition, or sale of assets, with notice where required.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Cookies and similar technologies">
        <p>
          We use cookies and local storage to keep you signed in, remember preferences, and
          understand how the Platform is used. You can control cookies through your browser
          settings, though some features may not work correctly if cookies are disabled.
        </p>
      </LegalSection>

      <LegalSection title="7. Data retention">
        <p>
          We retain account and listing data for as long as your account is active or as needed
          to provide the Platform. We may retain certain records after account deletion where
          required for legal, security, or dispute-resolution purposes.
        </p>
        <p>
          Property stories expire automatically after 24 hours, after which associated media may
          be removed from active display.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We implement reasonable technical and organizational measures — including encrypted
          connections (HTTPS), access controls, and secure password hashing — to protect your
          information. No method of transmission or storage is 100% secure; please use a strong,
          unique password and keep it confidential.
        </p>
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>Subject to applicable law, you may have the right to:</p>
        <LegalList
          items={[
            "Access a copy of personal data we hold about you.",
            "Correct inaccurate or incomplete information.",
            "Request deletion of your account and associated data.",
            "Withdraw consent where processing is consent-based.",
            "Lodge a complaint with a relevant data protection authority.",
          ]}
        />
        <p>
          To exercise these rights, email privacy@townexchange.in. We may need to verify your
          identity before processing requests.
        </p>
      </LegalSection>

      <LegalSection title="10. Children's privacy">
        <p>
          {APP_NAME} is not intended for users under 18. We do not knowingly collect personal
          information from children. If you believe a child has provided us data, contact us and
          we will take appropriate steps to delete it.
        </p>
      </LegalSection>

      <LegalSection title="11. Third-party links">
        <p>
          The Platform may contain links to third-party websites or services. We are not
          responsible for their privacy practices. Review their policies before sharing
          information with them.
        </p>
      </LegalSection>

      <LegalSection title="12. International transfers">
        <p>
          Your data may be processed on servers located in India or other countries where our
          service providers operate. We take steps to ensure appropriate safeguards when data is
          transferred across borders.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be posted on
          this page with an updated &quot;Last updated&quot; date. Continued use of the Platform
          after changes constitutes acceptance of the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <LegalList
          items={[
            "Privacy enquiries: privacy@townexchange.in",
            "General support: support@townexchange.in",
            `Stack Rack — ${APP_NAME}, ${APP_LOCATION}, Tamil Nadu, India`,
          ]}
        />
      </LegalSection>
    </LegalPageLayout>
  );
}
