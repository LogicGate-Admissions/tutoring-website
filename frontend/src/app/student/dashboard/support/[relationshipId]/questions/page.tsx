import { SupportFeaturePage } from '@/domains/async-support/components/pages/SupportFeaturePage';

type StudentQuestionsPageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function StudentQuestionsPage({
  params,
}: StudentQuestionsPageProps) {
  const { relationshipId } = await params;

  return (
    <SupportFeaturePage
      relationshipId={relationshipId}
      viewerRole="student"
      feature="questions"
    />
  );
}