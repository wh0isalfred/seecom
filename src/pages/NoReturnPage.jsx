import LegalPageLayout from '../components/LegalPageLayout';
import { NO_RETURN_MD } from '../content/legalPolicies';

export default function NoReturnPage({ onNavigate }) {
  return (
    <LegalPageLayout
      title="No-Return Policy"
      content={NO_RETURN_MD}
      onNavigate={onNavigate}
    />
  );
}
