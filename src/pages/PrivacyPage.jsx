import LegalPageLayout from '../components/LegalPageLayout';
import { PRIVACY_MD, COOKIES_MD } from '../content/legalPolicies';

export default function PrivacyPage({ onNavigate }) {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      content={`${PRIVACY_MD}\n\n---\n\n${COOKIES_MD}`}
      onNavigate={onNavigate}
    />
  );
}
