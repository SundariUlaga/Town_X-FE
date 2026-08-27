import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalList, LegalNote, LegalSection } from "@/components/legal/LegalProse";
import { APP_NAME, APP_LOCATION } from "@/components/brand/TownExchangeLogo";

export default function AboutUsPage() {
  return (
    <LegalPageLayout
      title="About Us"
      subtitle={`${APP_NAME} is ${APP_LOCATION}'s no-brokerage property marketplace — built to connect renters, buyers, and owners directly.`}
    >
      <LegalSection title="Our mission">
        <p>
          We believe finding a home in {APP_LOCATION} should be transparent, affordable, and free from
          unnecessary middlemen. {APP_NAME} helps people discover verified listings, compare
          options, save favourites, and reach owners without paying brokerage fees.
        </p>
        <p>
          Whether you are renting your first flat in Velachery, buying in OMR, or listing a
          property you own, our platform is designed to make every step simpler and more honest.
        </p>
      </LegalSection>

      <LegalSection title="What we offer">
        <LegalList
          items={[
            "Direct owner-to-seeker connections with no brokerage commission on the platform.",
            "Rich photo galleries and detailed property information for informed decisions.",
            "Favourites and comparison tools so you can shortlist homes at your pace.",
            "24-hour property stories for fresh, time-sensitive listings from owners.",
            "Dedicated dashboards for property owners and platform administrators.",
            "Tools such as EMI estimates to help buyers plan their budget.",
          ]}
        />
      </LegalSection>

      <LegalSection title={`Built for ${APP_LOCATION}`}>
        <p>
          {APP_NAME} is focused on {APP_LOCATION} and its neighbourhoods — from Anna Nagar and
          T. Nagar to Porur, Tambaram, and beyond. Listings, search filters, and local context
          are tailored to how people actually search for homes in this city.
        </p>
        <LegalNote>
          We are continuously expanding coverage and improving discovery based on feedback from
          local renters, buyers, and owners.
        </LegalNote>
      </LegalSection>

      <LegalSection title="Who we are">
        <p>
          {APP_NAME} is a product of <strong>Stack Rack</strong>, a technology company focused
          on building practical digital products for everyday needs. Stack Rack combines
          thoughtful design, reliable engineering, and user-first product thinking.
        </p>
        <p>
          Our team includes product designers, engineers, and customer support specialists who
          care about making property discovery less stressful and more trustworthy.
        </p>
      </LegalSection>

      <LegalSection title="Our values">
        <LegalList
          items={[
            "Transparency — clear pricing, honest listings, and open communication.",
            "Safety — guidance to verify properties in person before any payment.",
            "Accessibility — mobile-friendly experiences for users on any device.",
            "Respect — for owners' time, seekers' budgets, and everyone's privacy.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Contact us">
        <p>
          Have questions, feedback, or partnership ideas? We would love to hear from you.
        </p>
        <LegalList
          items={[
            "Email: hello@townexchange.in",
            "Support: support@townexchange.in",
            `Location: ${APP_LOCATION}, Tamil Nadu, India`,
          ]}
        />
      </LegalSection>
    </LegalPageLayout>
  );
}
