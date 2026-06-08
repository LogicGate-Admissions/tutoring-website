import { LessonWorkspacePage } from '@/domains/lesson-workspace/components/LessonWorkspacePage';

type TutorWorkspacePageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function TutorWorkspacePage({
  params,
}: TutorWorkspacePageProps) {
  const { relationshipId } = await params;

  return <LessonWorkspacePage relationshipId={relationshipId} viewerRole="tutor" />;
}
