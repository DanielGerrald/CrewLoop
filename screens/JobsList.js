import JobsListScreen from "../components/JobsListScreen";
import { getActiveJobs } from "../components/constants";

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
