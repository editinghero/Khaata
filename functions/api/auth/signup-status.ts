interface Env {
  DISABLE_SIGNUPS?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return Response.json({
    disabled: env.DISABLE_SIGNUPS === "true"
  });
};
