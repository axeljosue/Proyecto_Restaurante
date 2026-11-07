import type { EstadoPedido } from "../../types/pedido";

const STEPS = [
  { key: "SOLICITADO", label: "Solicitado" },
  { key: "CONFIRMADO", label: "Confirmado" },
  { key: "LISTO", label: "Listo para retirar" },
  { key: "ENTREGADO", label: "Entregado" },
] as const;

function stepIndex(estado: EstadoPedido): number {
  const idx = STEPS.findIndex((step) => step.key === estado);
  return idx;
}

interface PedidoStepperProps {
  estado: EstadoPedido;
}

export function PedidoStepper({ estado }: PedidoStepperProps) {
  if (estado === "CANCELADO") {
    return (
      <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
        Pedido cancelado
      </div>
    );
  }

  const current = stepIndex(estado);

  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, index) => {
        const completed = index <= current;
        const active = index === current;

        return (
          <li key={step.key} className="flex flex-col items-center text-center">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                completed
                  ? "bg-brand-700 text-white"
                  : "bg-stone-200 text-stone-500"
              } ${active ? "ring-2 ring-brand-500 ring-offset-2" : ""}`}
            >
              {index + 1}
            </span>
            <span
              className={`mt-2 text-[11px] leading-tight ${
                completed ? "font-medium text-brand-900" : "text-stone-400"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
