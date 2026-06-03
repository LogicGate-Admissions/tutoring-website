import { SupportFeaturePage } from '@/domains/async-support/components/pages/SupportFeaturePage';

type StudentResourcesPageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function StudentResourcesPage({
  params,
}: StudentResourcesPageProps) {
  const { relationshipId } = await params;

  return (
    <SupportFeaturePage
      relationshipId={relationshipId}
      viewerRole="student"
      feature="resources"
    />
  );
}