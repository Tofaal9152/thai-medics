import { useState } from "react";
import { useDebouncedCallback } from "./use-debounced-callback";

export function useSearch(
  onSearch: (value: string) => void,
  delay = 300
) {
  const [value, setValue] = useState("");

  const debouncedSearch = useDebouncedCallback(onSearch, delay);

  const onChange = (v: string) => {
    setValue(v);
    debouncedSearch(v);
  };

  return { value, onChange };
}
