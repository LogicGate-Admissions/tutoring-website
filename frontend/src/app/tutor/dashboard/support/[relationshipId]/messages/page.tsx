import { SupportFeaturePage } from '@/domains/async-support/components/pages/SupportFeaturePage';

type TutorMessagesPageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function TutorMessagesPage({
  params,
}: TutorMessagesPageProps) {
  const { relationshipId } = await params;

  return (
    <SupportFeaturePage
      relationshipId={relationshipId}
      viewerRole="tutor"
      feature="messages"
    />
  );
}