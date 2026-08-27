import { Link } from "react-router-dom";

import { FaqItem, LegalList, LegalNote, LegalSection } from "@/components/legal/LegalProse";
import { LEGAL_ROUTES } from "@/components/legal/FooterLinks";
import { APP_NAME, APP_LOCATION } from "@/components/brand/TownExchangeLogo";

export function FaqContent() {
  return (
    <>
      <LegalSection title="Getting started">
        <div className="space-y-3">
          <FaqItem
            question={`What is ${APP_NAME}?`}
            answer={
              <p>
                {APP_NAME} is a {APP_LOCATION}-focused property marketplace that connects renters and
                buyers directly with owners — with no platform brokerage fees. Browse listings,
                save favourites, watch property stories, and contact owners after signing in.
              </p>
            }
          />
          <FaqItem
            question={`Is ${APP_NAME} free to use?`}
            answer={
              <p>
                Yes. Creating an account, browsing listings, saving favourites, and using most
                features is free. {APP_NAME} does not charge brokerage commission. Any rent, sale
                price, or deposit is agreed directly between you and the property owner.
              </p>
            }
          />
          <FaqItem
            question="Who can sign up?"
            answer={
              <p>
                Anyone 18 or older can register. Choose a role when signing up — typically
                buyer/renter for people searching for property, or owner for people listing
                properties. Administrators manage the platform separately.
              </p>
            }
          />
          <FaqItem
            question="Why do I need to log in?"
            answer={
              <p>
                Login protects your favourites, enables property stories, lets owners post
                listings, and helps us keep the community safe. The public marketing page at /
                explains the product; the full app opens after you sign in.
              </p>
            }
          />
        </div>
      </LegalSection>

      <LegalSection title="Searching & listings">
        <div className="space-y-3">
          <FaqItem
            question="How do I search for properties?"
            answer={
              <p>
                After logging in, go to the property feed. Use search, category filters, BHK
                type, price range, furnishing, and sort options to narrow results. On mobile you
                can also swipe through cards in stack view.
              </p>
            }
          />
          <FaqItem
            question={`What areas does ${APP_NAME} cover?`}
            answer={
              <p>
                We focus on {APP_LOCATION} and surrounding neighbourhoods. Coverage grows as more owners
                list properties. Use locality and city filters to find homes in your preferred
                area.
              </p>
            }
          />
          <FaqItem
            question="How do property stories work?"
            answer={
              <p>
                Stories are short photo or video updates owners share about a listing. They appear
                for 24 hours — great for fresh availability, open-house reminders, or quick
                walkthrough clips. Tap a story ring on the home feed to view it.
              </p>
            }
          />
          <FaqItem
            question="Can I save properties to view later?"
            answer={
              <p>
                Yes. Tap the heart icon on any listing to add it to Favourites. Access your saved
                list anytime from the Favourites page in the app navigation.
              </p>
            }
          />
        </div>
      </LegalSection>

      <LegalSection title="For property owners">
        <div className="space-y-3">
          <FaqItem
            question="How do I list my property?"
            answer={
              <p>
                Sign up or log in with an owner account, then use the Post / Create Listing flow
                from the home page or your owner dashboard. Add photos, BHK details, location,
                price, furnishing, amenities, and availability.
              </p>
            }
          />
          <FaqItem
            question="Is there a fee to list?"
            answer={
              <p>
                Basic listing on {APP_NAME} is free during our current launch phase. If we
                introduce optional promoted listings or premium tools in the future, we will
                clearly disclose pricing before you opt in.
              </p>
            }
          />
          <FaqItem
            question="How do I manage my listings?"
            answer={
              <p>
                Owners have a dedicated dashboard showing active listings, views, and quick actions.
                You can edit details, upload new photos, or mark a property unavailable when it
                is rented or sold.
              </p>
            }
          />
        </div>
      </LegalSection>

      <LegalSection title="Safety & trust">
        <div className="space-y-3">
          <FaqItem
            question={`Does ${APP_NAME} verify every listing?`}
            answer={
              <p>
                We encourage accurate listings and may moderate content that violates our terms.
                However, you should always verify property details, ownership documents, and the
                identity of anyone you deal with in person before paying money.
              </p>
            }
          />
          <FaqItem
            question="How can I avoid rental or sale scams?"
            answer={
              <LegalList
                items={[
                  "Visit the property in person before paying any advance.",
                  "Never transfer money based on photos or messages alone.",
                  "Verify title deeds and the owner's identity.",
                  "Do not share OTPs or banking passwords with strangers.",
                  "Report suspicious listings to support@townexchange.in.",
                ]}
              />
            }
          />
          <FaqItem
            question={`Is ${APP_NAME} a broker?`}
            answer={
              <p>
                No. {APP_NAME} is a technology platform operated by Stack Rack. We connect users
                but are not a party to lease or sale agreements and do not collect brokerage
                commission on transactions.
              </p>
            }
          />
        </div>
      </LegalSection>

      <LegalSection title="Account & technical">
        <div className="space-y-3">
          <FaqItem
            question="I forgot my password. What should I do?"
            answer={
              <p>
                Use the password reset option on the login form (when available) or email
                support@townexchange.in from your registered email address for assistance.
              </p>
            }
          />
          <FaqItem
            question="How do I delete my account?"
            answer={
              <p>
                Email privacy@townexchange.in with your account email and a deletion request. We
                will process it in line with our{" "}
                <Link to={LEGAL_ROUTES.privacy} className="font-medium text-brand-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            }
          />
          <FaqItem
            question="The app is not loading properly. What can I try?"
            answer={
              <LegalList
                items={[
                  "Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R).",
                  "Clear browser cache or try a private/incognito window.",
                  "Ensure you have a stable internet connection.",
                  "Contact support@townexchange.in with your device and browser details.",
                ]}
              />
            }
          />
        </div>
      </LegalSection>

      <LegalNote>
        Still have questions? Read our{" "}
        <Link to={LEGAL_ROUTES.about} className="font-medium text-brand-700 hover:underline">
          About Us
        </Link>{" "}
        page or email{" "}
        <a href="mailto:support@townexchange.in" className="font-medium text-brand-700 hover:underline">
          support@townexchange.in
        </a>
        . For legal terms, see our{" "}
        <Link to={LEGAL_ROUTES.terms} className="font-medium text-brand-700 hover:underline">
          Terms &amp; Conditions
        </Link>
        .
      </LegalNote>
    </>
  );
}

export default FaqContent;
