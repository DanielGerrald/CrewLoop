import JobsListScreen from "../Components/JobsListScreen";
import { getActiveJobs } from "../Components/constants";

export default function JobsList() {
  return (
    <JobsListScreen
      title="Active Jobs"
      emptyMessage="There are currently no active jobs."
      filterJobs={getActiveJobs}
      showLoadingGate
    />
  );
}
