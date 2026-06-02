/**
 * File purpose: Small preferences UI/helper file used by the student learning profile flow.
 */

/**
 * Preferred university preference section.
 *
 * This stays optional because university preference should improve matching, not
 * block students who simply want the best tutor regardless of university.
 */

import { Card } from '@/shared/components/Card';
import { SearchableMultiSelect } from '@/shared/components/SearchableMultiSelect';
import { UNIVERSITY_OPTIONS } from '@/domains/students/learning-profile/constants/learningProfileOptions';

type PreferredUniversitiesSectionProps = {
  preferredUniversities: string[];
  onAddUniversity: (university: string) => void;
  onRemoveUniversity: (university: string) => void;
};

export function PreferredUniversitiesSection({
  preferredUniversities,
  onAddUniversity,
  onRemoveUniversity,
}: PreferredUniversitiesSectionProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Preferred universities</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Add universities you would prefer tutors to come from. You can leave
        this blank if you do not mind.
      </p>

      <div className="mt-5">
        <SearchableMultiSelect
          label="Search universities"
          options={[...UNIVERSITY_OPTIONS]}
          selectedOptions={preferredUniversities}
          getOptionKey={(university) => university}
          getOptionLabel={(university) => university}
          onSelect={onAddUniversity}
          onRemove={onRemoveUniversity}
          emptyMessage="No universities found."
        />
      </div>
    </Card>
  );
}
