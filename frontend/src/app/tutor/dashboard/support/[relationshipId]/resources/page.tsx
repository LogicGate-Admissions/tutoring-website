import { SupportFeaturePage } from '@/domains/async-support/components/pages/SupportFeaturePage';

type TutorResourcesPageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function TutorResourcesPage({
  params,
}: TutorResourcesPageProps) {
  const { relationshipId } = await params;

  return (
    <SupportFeaturePage
      relationshipId={relationshipId}
      viewerRole="tutor"
      feature="resources"
    />
  );
}