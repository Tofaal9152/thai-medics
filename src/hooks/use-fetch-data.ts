import { request } from "@/lib/http/request";
import { useQuery } from "@tanstack/react-query";
import type {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

type FetchArgs<T> = {
  url: string;
  querykey: QueryKey;
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">;
};

export function useFetchData<T>({
  url,
  querykey,
  options,
}: FetchArgs<T>): UseQueryResult<T> {
  return useQuery<T>({
    queryKey: querykey,
    queryFn: async () => request.get<T>(url),
    ...options,
  });
}
