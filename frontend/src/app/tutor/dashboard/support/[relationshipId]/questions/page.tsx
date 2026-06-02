import { SupportFeaturePage } from '@/domains/async-support/components/pages/SupportFeaturePage';

type TutorQuestionsPageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function TutorQuestionsPage({
  params,
}: TutorQuestionsPageProps) {
  const { relationshipId } = await params;

  return (
    <SupportFeaturePage
      relationshipId={relationshipId}
      viewerRole="tutor"
      feature="questions"
    />
  );
}