import { env } from "@/lib/env";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";

type UseMutationHandlerOptions<TData, TVariables> = {
  mutationFn: (data: TVariables) => Promise<TData>;

  invalidateKeys?: QueryKey[]; //  multiple queries invalidate
  successMessage?: string;
  errorMessage?: string;

  showSuccessToast?: boolean;
  showErrorToast?: boolean;

  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;

  debug?: boolean;
  debugLabel: string;
};

export function useMutationHandler<TData, TVariables>({
  mutationFn,
  invalidateKeys,
  successMessage,
  errorMessage,
  showSuccessToast = true,
  showErrorToast = true,
  onSuccess,
  onError,
  debug = true,
  debugLabel = "Api",
}: UseMutationHandlerOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, AxiosError, TVariables>({
    mutationFn,

    onSuccess: async (data) => {
      // Debug logging for success
      if (debug && env.isDevelopment) {
        console.group(`✅ [${debugLabel ?? "Mutation"}] Success`);
        console.log("Response:", data);
        console.groupEnd();
      }
      // Invalidate specified queries to refetch fresh data
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: key }),
          ),
        );
      }
      // Show success toast if enabled
      if (showSuccessToast && successMessage) {
        toast.add({ title: successMessage, type: "success" });
      }
      // Call the onSuccess callback if provided
      onSuccess?.(data);
    },

    onError: (error) => {
      // API's own message first, then the caller's errorMessage — never axios's
      // generic "Request failed with status code 500".
      const apiMessage = (error.response?.data as { message?: string } | undefined)
        ?.message;
      const msg = apiMessage || errorMessage || "Something went wrong";
      // Debug logging for errors
      if (debug && env.isDevelopment) {
        console.group(`❌ [${debugLabel ?? "Mutation"}] Error`);
        console.log("Status:", error.response?.status);
        console.log("Message:", msg);
        console.log("Full error:", error);
        console.groupEnd();
      }
      // Determine error message to show
      if (showErrorToast) {
        toast.add({ title: msg, type: "error" });
      }
      // Call the onError callback if provided
      onError?.(error);
    },
  });
}
