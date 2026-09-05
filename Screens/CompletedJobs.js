import JobsListScreen from "../Components/JobsListScreen";
import { getCompletedJobs } from "../Components/constants";

export default function CompletedJobs() {
  return (
    <JobsListScreen
      title="Completed Jobs"
      emptyMessage="There are currently no completed jobs."
      filterJobs={getCompletedJobs}
    />
  );
}
