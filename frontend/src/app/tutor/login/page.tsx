/**
 * File purpose: Tutor auth route. Keep route files thin and delegate UI to domains/.
 */

import { AuthPage } from '@/domains/auth/components/AuthPage';

/** URL: /tutor/login */
export default function TutorLoginPage() {
  return <AuthPage role="tutor" />;
}
