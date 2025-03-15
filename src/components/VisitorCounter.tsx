import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateVisitorCount, getVisitorStats } from "../api/visitor";

const VisitorCounter = () => {
  const queryClient = useQueryClient();

  // Fetch visitor stats
  const { data: visitorStats, isLoading, isError } = useQuery({
    queryKey: ["visitorStats"],
    queryFn: getVisitorStats,
  });

  // Mutation to update visitor count
  const mutation = useMutation({
    mutationFn: updateVisitorCount,
    onSuccess: () => {
      // Refetch visitor stats after updating the count
      queryClient.invalidateQueries({ queryKey: ["visitorStats"] });
    },
  });

  useEffect(() => {
    mutation.mutate(); // Call the update API once when the component mounts
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching visitor data.</p>;

  return (
    <div>
      <p>Today's Visitors: {visitorStats?.dailyVisitors ?? 0}</p>
      <p>Total Visitors: {visitorStats?.totalVisitors ?? 0}</p>
    </div>
  );
};

export default VisitorCounter;