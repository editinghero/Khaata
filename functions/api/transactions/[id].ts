import { d1Repo } from "../../../db/d1";
import { Env, getUserFromSession } from "../_auth";

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id as string;
  const body = await request.json() as any;
  const { userId: _, ...patch } = body;

  const repo = d1Repo(env.DB);
  await repo.update(id, patch, userId);

  return Response.json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id as string;

  const repo = d1Repo(env.DB);
  await repo.remove(id, userId);

  return Response.json({ success: true });
};
