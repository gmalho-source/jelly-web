import PressKit from "@/components/press/PressKit";
import { metadadosDoPressKit } from "../Casca";

export const metadata = metadadosDoPressKit("pt");

export default function Page() {
  return <PressKit lang="pt" />;
}
