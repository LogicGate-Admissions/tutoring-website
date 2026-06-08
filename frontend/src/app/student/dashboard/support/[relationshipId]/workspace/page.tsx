import { LessonWorkspacePage } from '@/domains/lesson-workspace/components/LessonWorkspacePage';

type StudentWorkspacePageProps = {
  params: Promise<{
    relationshipId: string;
  }>;
};

export default async function StudentWorkspacePage({
  params,
}: StudentWorkspacePageProps) {
  const { relationshipId } = await params;

  return (
    <LessonWorkspacePage relationshipId={relationshipId} viewerRole="student" />
  );
}
