import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { customerForLoginToken, startSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const customerId = token ? await customerForLoginToken(token) : null;
  if (!customerId) redirect("/inloggen?verlopen=1");
  await startSession(customerId);
  redirect(request.nextUrl.searchParams.get("naar") === "opzeggen" ? "/account?opzeggen=1" : "/account");
}
