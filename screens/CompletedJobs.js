import JobsListScreen from "../components/JobsListScreen";
import { getCompletedJobs } from "../components/constants";

export default function CompletedJobs() {
  return (
    <JobsListScreen
      title="Completed Jobs"
      emptyMessage="There are currently no completed jobs."
      filterJobs={getCompletedJobs}
    />
  );
}
