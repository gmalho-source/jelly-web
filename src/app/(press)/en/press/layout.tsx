import "@/app/globals.css";
import { Casca } from "../../Casca";

/** O press kit em inglês: documento próprio, ver Casca.tsx. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Casca lang="en">{children}</Casca>;
}
