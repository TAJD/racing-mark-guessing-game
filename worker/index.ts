export default {
  fetch(_request: Request): Response {
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
