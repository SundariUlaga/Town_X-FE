import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalList, LegalNote, LegalSection } from "@/components/legal/LegalProse";
import { APP_NAME, APP_LOCATION } from "@/components/brand/TownExchangeLogo";

const LAST_UPDATED = "August 5, 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle={`Please read these terms carefully before using ${APP_NAME}. By accessing or using our platform, you agree to be bound by them.`}
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection title="1. Acceptance of terms">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the
          {APP_NAME} website, mobile experiences, and related services (collectively, the
          &quot;Platform&quot;), operated by Stack Rack (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;).
        </p>
        <p>
          If you do not agree to these Terms, you must not use the Platform. We may update these
          Terms from time to time; continued use after changes constitutes acceptance of the
          revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <LegalList
          items={[
            "You must be at least 18 years old to create an account or list a property.",
            "You must provide accurate registration information and keep your account secure.",
            "You may not use the Platform if you are prohibited from doing so under applicable law.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Account registration">
        <p>
          To access certain features — including favourites, property stories, posting listings,
          and dashboards — you must register for an account. You are responsible for all activity
          under your account and for maintaining the confidentiality of your login credentials.
        </p>
        <p>
          Notify us immediately at support@townexchange.in if you suspect unauthorized access to
          your account.
        </p>
      </LegalSection>

      <LegalSection title="4. Platform role">
        <LegalNote>
          {APP_NAME} is a marketplace that facilitates connections between property owners and
          seekers. We are not a real estate broker, agent, or party to any transaction between
          users.
        </LegalNote>
        <p>
          We do not guarantee the accuracy, completeness, or availability of any listing. Users
          are solely responsible for verifying property details, ownership, legal title, and
          suitability before entering into any agreement or making any payment.
        </p>
      </LegalSection>

      <LegalSection title="5. Listings and user content">
        <p>When you post a listing, story, or other content on the Platform, you represent that:</p>
        <LegalList
          items={[
            "You have the right to publish the content and share the property information.",
            "Your listing is truthful, not misleading, and complies with applicable laws.",
            "Photos and media accurately depict the property offered.",
            "You will update or remove listings promptly when a property is no longer available.",
          ]}
        />
        <p>
          We reserve the right to review, moderate, edit, or remove content that violates these
          Terms or applicable law, without prior notice.
        </p>
      </LegalSection>

      <LegalSection title="6. Prohibited conduct">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Post false, fraudulent, or duplicate listings.",
            "Harass, threaten, or discriminate against other users.",
            "Collect user data without consent or use the Platform for unsolicited marketing.",
            "Attempt to bypass security, scrape data at scale, or disrupt Platform operations.",
            "Upload malware, illegal content, or material that infringes third-party rights.",
            "Impersonate another person or misrepresent your affiliation with a property.",
            "Use the Platform for money laundering or any unlawful financial activity.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Fees and payments">
        <p>
          Browsing listings and contacting owners through {APP_NAME} is intended to be free of
          platform brokerage fees. Any rent, sale price, deposit, or fee negotiated between users
          is strictly between those parties.
        </p>
        <p>
          We may introduce optional paid features in the future. If so, pricing and billing terms
          will be disclosed before you are charged.
        </p>
      </LegalSection>

      <LegalSection title="8. Safety guidelines">
        <LegalList
          items={[
            "Always visit a property in person before paying any advance or deposit.",
            "Verify ownership documents and identity of the person you are dealing with.",
            "Avoid sharing OTPs, passwords, or full bank details with unknown parties.",
            "Report suspicious listings or behaviour to support@townexchange.in.",
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          The {APP_NAME} name, logo, design, and Platform software are owned by Stack Rack or its
          licensors. You may not copy, modify, or distribute our branding or code without written
          permission.
        </p>
        <p>
          You retain ownership of content you submit but grant us a non-exclusive, worldwide,
          royalty-free licence to display, store, and promote that content in connection with
          operating the Platform.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimers">
        <p>
          THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          We do not warrant uninterrupted or error-free service, nor the outcome of any property
          search, negotiation, or transaction.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Stack Rack and its affiliates shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages, or
          any loss of profits, data, or goodwill arising from your use of the Platform.
        </p>
        <p>
          Our total liability for any claim relating to the Platform shall not exceed the amount
          you paid us (if any) in the twelve months preceding the claim, or INR 5,000, whichever
          is greater.
        </p>
      </LegalSection>

      <LegalSection title="12. Termination">
        <p>
          You may stop using the Platform at any time. We may suspend or terminate your account
          if you breach these Terms or if we reasonably believe your conduct poses risk to other
          users or the Platform.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing law">
        <p>
          These Terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of the courts in {APP_LOCATION}, Tamil Nadu, unless otherwise required
          by applicable consumer protection law.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <LegalList
          items={[
            `Stack Rack — ${APP_NAME}`,
            "Email: legal@townexchange.in",
            "Support: support@townexchange.in",
            `${APP_LOCATION}, Tamil Nadu, India`,
          ]}
        />
      </LegalSection>
    </LegalPageLayout>
  );
}
