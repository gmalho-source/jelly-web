import "@/app/globals.css";
import { Casca } from "../Casca";

/** O press kit em português: documento próprio, ver Casca.tsx. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Casca lang="pt">{children}</Casca>;
}
