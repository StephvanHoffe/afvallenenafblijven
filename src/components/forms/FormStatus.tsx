export interface FormState {
  ok?: boolean;
  message?: string;
}

export function FormStatus({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${state.ok ? "bg-brand-50 text-brand-800" : "bg-accent-50 text-accent-600"}`}
    >
      {state.message}
    </p>
  );
}
