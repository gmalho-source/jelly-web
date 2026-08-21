/**
 * Etiqueta numerada de secção. É a espinha da página: diz sempre em que
 * capítulo estás, e dá ritmo ao que de outra forma seria uma pilha de blocos.
 */
export function Chapter({ label, number }: { label: string; number: string }) {
  return (
    <p className="eyebrow text-fg-soft">
      {label} <span className="text-accent">/ {number}</span>
    </p>
  );
}
