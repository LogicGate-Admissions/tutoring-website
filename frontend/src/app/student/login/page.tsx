/**
 * File purpose: Student auth route. Keep route files thin and delegate UI to domains/.
 */

import { AuthPage } from '@/domains/auth/components/AuthPage';

/** URL: /student/login */
export default function StudentLoginPage() {
  return <AuthPage role="student" />;
}
