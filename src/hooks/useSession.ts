import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api';
import type { ChoiceResponse, FinishResponse, TimeoutResponse } from '../types/api';

export function useSession(sessionId: string | undefined) {
  const queryClient = useQueryClient();

  const nodeQuery = useQuery({
    queryKey: ['node', sessionId],
    queryFn: () => sessionsApi.getNode(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const invalidateNode = () => {
    if (sessionId) {
      void queryClient.invalidateQueries({ queryKey: ['node', sessionId] });
    }
  };

  const choiceMutation = useMutation({
    mutationFn: (choiceKey: string) =>
      sessionsApi.postChoice(sessionId!, { choice_key: choiceKey }),
    onSuccess: () => {
      invalidateNode();
    },
  });

  const timeoutMutation = useMutation({
    mutationFn: () => sessionsApi.postTimeout(sessionId!),
    onSuccess: () => {
      invalidateNode();
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => sessionsApi.postFinish(sessionId!),
    onSuccess: () => {
      invalidateNode();
    },
  });

  return {
    node: nodeQuery.data,
    isLoading: nodeQuery.isLoading,
    isFetching: nodeQuery.isFetching,
    error: nodeQuery.error,
    refetch: nodeQuery.refetch,
    makeChoice: choiceMutation.mutateAsync as (choiceKey: string) => Promise<ChoiceResponse>,
    isChoosing: choiceMutation.isPending,
    triggerTimeout: timeoutMutation.mutateAsync as () => Promise<TimeoutResponse>,
    isTimingOut: timeoutMutation.isPending,
    finish: finishMutation.mutateAsync as () => Promise<FinishResponse>,
    isFinishing: finishMutation.isPending,
  };
}
