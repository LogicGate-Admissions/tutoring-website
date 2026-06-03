import { SupportFeaturePage } from '@/domains/async-support/components/pages/SupportFeaturePage';

type StudentMessagesPageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function StudentMessagesPage({
  params,
}: StudentMessagesPageProps) {
  const { relationshipId } = await params;

  return (
    <SupportFeaturePage
      relationshipId={relationshipId}
      viewerRole="student"
      feature="messages"
    />
  );
}