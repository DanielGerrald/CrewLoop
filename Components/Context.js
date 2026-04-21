import { createContext, useContext, useState } from "react";

const JobContext = createContext();

export function JobProvider({ children }) {
  const [jobResult, setJobResult] = useState([]);
  const [syncVersion, setSyncVersion] = useState(0);

  const incrementSyncVersion = () => setSyncVersion((v) => v + 1);

  return (
    <JobContext.Provider
      value={{ jobResult, setJobResult, syncVersion, incrementSyncVersion }}
    >
      {children}
    </JobContext.Provider>
  );
}

export const useJob = () => useContext(JobContext);
