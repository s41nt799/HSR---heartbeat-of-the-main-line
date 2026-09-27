import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api';
import type {
  ChoiceResultResponse,
  SessionResponse,
} from '../types/api';

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
      sessionsApi.postChoice(sessionId!, { choice_key: choiceKey, version: 0 }),
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
    makeChoice: choiceMutation.mutateAsync as (
      choiceKey: string,
    ) => Promise<ChoiceResultResponse>,
    isChoosing: choiceMutation.isPending,
    triggerTimeout: timeoutMutation.mutateAsync as () => Promise<ChoiceResultResponse>,
    isTimingOut: timeoutMutation.isPending,
    finish: finishMutation.mutateAsync as () => Promise<SessionResponse>,
    isFinishing: finishMutation.isPending,
  };
}