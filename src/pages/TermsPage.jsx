import LegalPageLayout from '../components/LegalPageLayout';
import { TERMS_MD, SHIPPING_MD } from '../content/legalPolicies';

export default function TermsPage({ onNavigate }) {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      content={`${TERMS_MD}\n\n---\n\n${SHIPPING_MD}`}
      onNavigate={onNavigate}
    />
  );
}
