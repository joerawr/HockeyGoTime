import { redirect } from "next/navigation";

export default function Home() {
  // Issue #3: Redirect to HockeyGoTime as default (hide examples)
  redirect("/hockey");
}
